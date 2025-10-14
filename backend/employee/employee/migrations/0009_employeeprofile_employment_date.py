from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employee', '0008_employeeprofile_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='employeeprofile',
            name='employment_date',
            field=models.DateField(blank=True, help_text='Employee employment start date used for annual leave calculations.', null=True),
        ),
    ]
