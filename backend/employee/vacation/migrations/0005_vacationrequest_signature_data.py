from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vacation', '0004_vacationitem_leave_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='vacationrequest',
            name='signature_data',
            field=models.TextField(blank=True, help_text="Base64 encoded representation of the employee's handwritten signature.", default=''),
            preserve_default=False,
        ),
    ]
