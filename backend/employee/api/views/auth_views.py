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


class TokenObtainPairViewCustom(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
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
        
        # Perform refresh operation
        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            # Return the new access token
            return Response(data)
        return response
    
@method_decorator(cache_page(settings.CACHE_TIMEOUTS['user_profile']), name='get')
class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username,
            "firstname": request.user.first_name,
            "lastname": request.user.last_name,
            "email": request.user.email,
            "role": request.user.profile.role,
            "annual_leave_days": request.user.profile.annual_leave_days,
        })
    
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