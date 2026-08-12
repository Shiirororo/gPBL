from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0002_aiconversation_aiexchange'),
    ]

    operations = [
        migrations.AddField(
            model_name='codingchallenge',
            name='function_name',
            field=models.CharField(default='solution', max_length=100),
        ),
    ]
