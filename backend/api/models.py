from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class RegleLegale(models.Model):
    code = models.CharField(max_length=50, primary_key=True)
    description = models.TextField()
    valeur_numerique = models.DecimalField(max_digits=10, decimal_places=2)
    unite = models.CharField(max_length=20)

    class Meta:
        db_table = 'regle_legale'

class Grade(models.Model):
    libelle = models.CharField(max_length=100, unique=True)
    eligibilite_garde_nuit = models.BooleanField(default=True)

    class Meta:
        db_table = 'grade'
        
    def __str__(self):
        return self.libelle

class Specialite(models.Model):
    libelle = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sous_specialites')

    class Meta:
        db_table = 'specialite'

class Soignant(models.Model):
    matricule = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, null=True, blank=True)
    telephone = models.CharField(max_length=20, null=True, blank=True)
    is_actif = models.BooleanField(default=True)
    grade = models.ForeignKey(Grade, on_delete=models.PROTECT)
    specialites = models.ManyToManyField(Specialite, db_table='soignant_specialite', blank=True)

    class Meta:
        db_table = 'soignant'
        
    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

class Contrat(models.Model):
    soignant = models.ForeignKey(Soignant, on_delete=models.CASCADE, related_name='contrats')
    type_contrat = models.CharField(max_length=50)
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    pourcentage_tps_travail = models.DecimalField(max_digits=3, decimal_places=2, validators=[MinValueValidator(0.01), MaxValueValidator(1.0)])
    heures_max_hebdo = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    class Meta:
        db_table = 'contrat'

class Certification(models.Model):
    libelle = models.CharField(max_length=100)
    prerequis = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='certifications_suivantes')

    class Meta:
        db_table = 'certification'

class SoignantCertification(models.Model):
    soignant = models.ForeignKey(Soignant, on_delete=models.CASCADE, related_name='certifications')
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    date_obtention = models.DateField()
    date_expiration = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'soignant_certification'

class Service(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    capacite_lits = models.IntegerField(validators=[MinValueValidator(0)])
    niveau_criticite = models.IntegerField(default=1)
    soignant_responsable = models.ForeignKey(Soignant, on_delete=models.SET_NULL, null=True, blank=True, related_name='services_geres')

    class Meta:
        db_table = 'service'

class UniteSoin(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='unites')
    nom = models.CharField(max_length=100)

    class Meta:
        db_table = 'unite_soin'

class TypeGarde(models.Model):
    libelle = models.CharField(max_length=50)
    is_nuit = models.BooleanField(default=False)
    is_astreinte = models.BooleanField(default=False)
    duree_standard_heures = models.DecimalField(max_digits=4, decimal_places=2)

    class Meta:
        db_table = 'type_garde'

class PosteGarde(models.Model):
    unite = models.ForeignKey(UniteSoin, on_delete=models.CASCADE, related_name='postes')
    type_garde = models.ForeignKey(TypeGarde, on_delete=models.PROTECT)
    debut_prevu = models.DateTimeField()
    fin_prevue = models.DateTimeField()
    nb_soignants_min = models.IntegerField(default=1, validators=[MinValueValidator(0)])
    nb_soignants_max = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    certifications_requises = models.ManyToManyField(Certification, db_table='poste_certification_requise', blank=True)

    class Meta:
        db_table = 'poste_garde'

class Affectation(models.Model):
    STATUT_CHOICES = [
        ('VALIDE', 'Valide'),
        ('ANNULE', 'Annulé'),
    ]
    poste = models.ForeignKey(PosteGarde, on_delete=models.CASCADE, related_name='affectations')
    soignant = models.ForeignKey(Soignant, on_delete=models.RESTRICT, related_name='affectations')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='VALIDE')

    class Meta:
        db_table = 'affectation'
        unique_together = ('poste', 'soignant')

class TypeAbsence(models.Model):
    libelle = models.CharField(max_length=50)
    impacte_quota_garde = models.BooleanField(default=True)

    class Meta:
        db_table = 'type_absence'

class Absence(models.Model):
    soignant = models.ForeignKey(Soignant, on_delete=models.CASCADE, related_name='absences')
    type_absence = models.ForeignKey(TypeAbsence, on_delete=models.PROTECT)
    date_debut = models.DateField()
    date_fin_prevue = models.DateField()
    date_fin_reelle = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'absence'
