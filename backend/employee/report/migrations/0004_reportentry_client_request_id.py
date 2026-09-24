from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('report', '0003_alter_reportentry_options_and_more')]

    operations = [
        migrations.AddField(
            model_name='reportentry',
            name='client_request_id',
            field=models.UUIDField(blank=True, editable=False, null=True),
        ),
        migrations.AddConstraint(
            model_name='reportentry',
            constraint=models.UniqueConstraint(
                fields=('salesman', 'client_request_id'),
                name='report_salesman_request_unique',
            ),
        ),
    ]
