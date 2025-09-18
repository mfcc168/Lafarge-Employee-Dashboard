from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.conf import settings
from django.views.decorators.cache import cache_page
from core.redis_config import safe_cache_delete
from employee.models import EmployeeProfile
from django.contrib.auth import authenticate


class TokenObtainPairViewCustom(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # First authenticate the user
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            # Check if the employee profile exists and is active
            try:
                profile = EmployeeProfile.objects.get(user=user)
                if not profile.is_active:
                    return Response(
                        {"detail": "This account has been deactivated. Please contact an administrator."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except EmployeeProfile.DoesNotExist:
                # If no profile exists, allow login (backwards compatibility)
                pass
        
        # Call the parent post method to obtain token pair
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            return Response(data)
        return response


class TokenRefreshViewCustom(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get the refresh token from request body
        refresh_token = request.data.get('refresh', None)
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform refresh operation to get the user from the token
        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get the user from the refresh token
            from rest_framework_simplejwt.tokens import RefreshToken
            try:
                token = RefreshToken(refresh_token)
                user_id = token.payload.get('user_id')
                if user_id:
                    from django.contrib.auth.models import User
                    user = User.objects.get(id=user_id)
                    # Check if the employee profile is active
                    try:
                        profile = EmployeeProfile.objects.get(user=user)
                        if not profile.is_active:
                            return Response(
                                {"detail": "This account has been deactivated. Please contact an administrator."},
                                status=status.HTTP_403_FORBIDDEN
                            )
                    except EmployeeProfile.DoesNotExist:
                        # If no profile exists, allow refresh (backwards compatibility)
                        pass
            except Exception:
                pass  # Let the normal error handling take over
                
            data = response.data
            # Return the new access token
            return Response(data)
        return response
    
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Cache per user using manual caching instead of cache_page decorator
        # to ensure each user gets their own cached response
        from django.core.cache import cache
        cache_key = f'user_profile_{request.user.id}'
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # Add logging to debug role issues
        import logging
        logger = logging.getLogger(__name__)
        
        # Check if user has a profile
        if not hasattr(request.user, 'profile'):
            # Create a default profile if it doesn't exist
            try:
                profile = EmployeeProfile.objects.create(
                    user=request.user,
                    role='ADMIN' if request.user.is_superuser else 'DELIVERYMAN'
                )
                logger.warning(f"Created missing profile for user {request.user.username} with role {profile.role}")
            except Exception as e:
                logger.error(f"Failed to create profile for user {request.user.username}: {str(e)}")
                return Response({
                    "error": "User profile not found and could not be created"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            role = request.user.profile.role
            annual_leave_days = request.user.profile.annual_leave_days
            logger.info(f"User {request.user.username} has role: {role}")
        except Exception as e:
            logger.error(f"Error getting profile data for user {request.user.username}: {str(e)}")
            role = None
            annual_leave_days = 7.0
        
        data = {
            "username": request.user.username,
            "firstname": request.user.first_name,
            "lastname": request.user.last_name,
            "email": request.user.email,
            "role": role,
            "annual_leave_days": annual_leave_days,
        }
        
        # Cache the user data
        cache.set(cache_key, data, settings.CACHE_TIMEOUTS['user_profile'])
        
        return Response(data)
    
class ChangePassword(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")

        if not user.check_password(current_password):
            return Response({"detail": "Current password is incorrect"}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"detail": list(e.messages)}, status=400)

        user.set_password(new_password)
        user.save()
        
        # Invalidate user cache after password change
        safe_cache_delete(f'user_profile_{user.id}')

        return Response({"detail": "Password changed successfully"})