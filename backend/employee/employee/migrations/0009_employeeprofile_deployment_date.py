from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employee', '0008_employeeprofile_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='employeeprofile',
            name='deployment_date',
            field=models.DateField(blank=True, help_text='Date when the employee was deployed to their current role.', null=True),
        ),
    ]
