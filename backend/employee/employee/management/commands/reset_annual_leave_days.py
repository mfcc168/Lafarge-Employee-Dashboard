from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from employee.models import EmployeeProfile


class Command(BaseCommand):
    help = "Reset annual leave days for all employees based on employment date and service year."

    def add_arguments(self, parser):
        parser.add_argument(
            '--as-of',
            type=str,
            help="Optional ISO date (YYYY-MM-DD) to calculate entitlements as of a specific day. Defaults to today.",
        )

    def handle(self, *args, **options):
        as_of_option = options.get('as_of')
        if as_of_option:
            try:
                as_of_date = datetime.strptime(as_of_option, "%Y-%m-%d").date()
            except ValueError:
                self.stderr.write(self.style.ERROR("Invalid --as-of date format. Use YYYY-MM-DD."))
                return
        else:
            as_of_date = timezone.now().date()

        profiles = EmployeeProfile.objects.select_related('user').all()
        updates = []
        skipped_without_date = 0

        for profile in profiles:
            entitlement = profile.calculate_annual_leave_entitlement(as_of_date=as_of_date)
            if profile.annual_leave_days != entitlement:
                profile.annual_leave_days = entitlement
                updates.append(profile)

            if profile.employment_date is None:
                skipped_without_date += 1

        if updates:
            EmployeeProfile.objects.bulk_update(updates, ['annual_leave_days'])

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {profiles.count()} employees. "
                f"{len(updates)} had their annual leave updated. "
                f"{skipped_without_date} employees are missing an employment date."
            )
        )
