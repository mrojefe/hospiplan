-- =========================================================================
-- HospiPlan - Script de Population (Seed)
-- Insère un jeu de données de test couvrant tous les cas des exigences.
-- =========================================================================

-- Vider manuellement ou confier au schema.sql le DROP.

-- REGLES LÉGALES (F-10)
INSERT INTO REGLE_LEGALE (code, description, valeur_numerique, unite) VALUES
('MAX_HEURES_HEBDO', 'Maximum d''heures travaillées par semaine', 48.0, 'heures'),
('MAX_NUIT_CONSECUTIVES', 'Nombre maximum de nuits d''affilée', 3.0, 'jours'),
('REPOS_MIN_POST_NUIT', 'Temps de repos obligatoire après une nuit', 11.0, 'heures');

-- GRADES (F-01)
INSERT INTO GRADE (id, libelle, eligibilite_garde_nuit) VALUES
(1, 'Médecin Senior', TRUE),
(2, 'Interne', TRUE),
(3, 'Infirmier(ère)', TRUE),
(4, 'Stagiaire', FALSE);

-- SPÉCIALITÉS (F-01)
INSERT INTO SPECIALITE (id, libelle, parent_id) VALUES
(1, 'Médecine Générale', NULL),
(2, 'Urgences', 1),
(3, 'Cardiologie', NULL),
(4, 'Cardiologie Pédiatrique', 3);

-- SOIGNANTS
INSERT INTO SOIGNANT (id, matricule, nom, prenom, email, telephone, is_actif, grade_id) VALUES
(1, 'MAT001', 'Dupont', 'Jean', 'jean.dupont@alamal.ext', '0600000001', TRUE, 1),
(2, 'MAT002', 'Martin', 'Sophie', 'sophie.martin@alamal.ext', '0600000002', TRUE, 3),
(3, 'MAT003', 'Diop', 'Amadou', 'amadou.diop@alamal.ext', '0600000003', TRUE, 2),
(4, 'MAT004', 'Chen', 'Zoe', 'zoe.chen@alamal.ext', '0600000004', TRUE, 4); -- stagiaire

-- SOIGNANTS SPÉCIALITÉS
INSERT INTO SOIGNANT_SPECIALITE (soignant_id, specialite_id) VALUES
(1, 1), (1, 2), -- Jean est Généraliste et Urgentiste
(3, 3); -- Amadou est Interne en Cardio

-- CONTRATS (F-02)
INSERT INTO CONTRAT (soignant_id, type_contrat, date_debut, date_fin, pourcentage_tps_travail, heures_max_hebdo) VALUES
(1, 'CDI', '2020-01-01', NULL, 1.0, 48.0),
(2, 'CDD', '2023-01-01', '2023-12-31', 0.5, 24.0), -- Ancien contrat mi-temps
(2, 'CDI', '2024-01-01', NULL, 1.0, 35.0), -- Nouveau contrat plein temps
(3, 'CDD', '2024-03-01', '2024-08-31', 1.0, 48.0),
(4, 'STAGE', '2024-04-01', '2024-06-30', 1.0, 35.0);

-- CERTIFICATIONS (F-03)
INSERT INTO CERTIFICATION (id, libelle, prerequis_id) VALUES
(1, 'Réanimation Basique (BLS)', NULL),
(2, 'Réanimation Avancée (ACLS)', 1), -- Exige BLS
(3, 'Triage Urgences', NULL);

-- CERTIFICATIONS OBTENUES
INSERT INTO SOIGNANT_CERTIFICATION (soignant_id, certification_id, date_obtention, date_expiration) VALUES
(1, 1, '2018-05-10', NULL),
(1, 2, '2020-06-15', '2025-06-15'), -- expire dans le futur
(2, 1, '2021-01-10', '2023-01-10'), -- expirée !!
(2, 3, '2022-03-05', NULL);

-- SERVICES (F-04)
INSERT INTO SERVICE (id, nom, capacite_lits, niveau_criticite, soignant_responsable_id) VALUES
(1, 'Urgences', 50, 5, 1),
(2, 'Cardiologie', 30, 4, 1);

-- ÉTAT SERVICES (Historique)
INSERT INTO ETAT_SERVICE (service_id, statut, date_debut, date_fin) VALUES
(2, 'SOUS_EFFECTIF', '2024-03-01', '2024-03-15');

-- UNITÉS DE SOIN
INSERT INTO UNITE_SOIN (id, service_id, nom) VALUES
(1, 1, 'Triage Urgences'),
(2, 1, 'Réanimation Urgences'),
(3, 2, 'Soins Continus Cardio');

-- AFFECTATIONS SOIGNANTS AUX SERVICES
INSERT INTO SOIGNANT_SERVICE (soignant_id, service_id, date_debut, date_fin) VALUES
(1, 1, '2020-01-01', NULL),
(2, 1, '2023-01-01', NULL),
(3, 2, '2024-03-01', NULL);

-- TYPES DE GARDE (F-05)
INSERT INTO TYPE_GARDE (id, libelle, is_nuit, is_astreinte, duree_standard_heures) VALUES
(1, 'Garde Jour 12H', FALSE, FALSE, 12.0),
(2, 'Garde Nuit 12H', TRUE, FALSE, 12.0),
(3, 'Astreinte Week-End', FALSE, TRUE, 24.0);

-- POSTES DE GARDE
INSERT INTO POSTE_GARDE (id, unite_id, type_garde_id, debut_prevu, fin_prevue, nb_soignants_min, nb_soignants_max) VALUES
(1, 1, 1, '2024-04-10 08:00:00', '2024-04-10 20:00:00', 2, 4), -- Urgences Triage Jour
(2, 2, 2, '2024-04-10 20:00:00', '2024-04-11 08:00:00', 1, 2); -- Urgences Réa Nuit

-- CERTIFICATIONS REQUISES POUR LES POSTES
INSERT INTO POSTE_CERTIFICATION_REQUISE (poste_id, certification_id) VALUES
(1, 3), -- Triage Urgences exige certification Triage
(2, 2); -- Réa Urgences exige ACLS

-- TYPES D'ABSENCES
INSERT INTO TYPE_ABSENCE (id, libelle, impacte_quota_garde) VALUES
(1, 'Congés Payés', TRUE),
(2, 'Maladie', TRUE),
(3, 'Formation', FALSE);

-- ABSENCES (F-06)
INSERT INTO ABSENCE (soignant_id, type_absence_id, date_debut, date_fin_prevue, date_fin_reelle) VALUES
(3, 1, '2024-04-05', '2024-04-15', NULL); -- Amadou est en congés, il ne pourra pas couvrir la garde du 10.

-- AFFECTATIONS (Gardes Réalisées / Prévues)
INSERT INTO AFFECTATION (poste_id, soignant_id, statut) VALUES
(1, 1, 'VALIDE'), -- Jean fait la garde de jour aux urgences
(2, 1, 'VALIDE'); -- Attention: Contrainte dure "repos 11h" sera enfreinte si système complet (Vérifié logiquement côté backend Phase 2)

-- CONTRAINTES DECLARÉES (F-07)
INSERT INTO CONTRAINTE_SOIGNANT (soignant_id, description, est_imperative, datetime_debut, datetime_fin, valide_jusqu_au) VALUES
(2, 'Indisponible les vendredis mâtin (Religion)', TRUE, '2024-01-01 06:00:00', '2024-01-01 12:00:00', NULL);

-- CHARGE PATIENTE (F-08)
INSERT INTO CHARGE_PATIENTE (unite_id, date_releve, nombre_patients) VALUES
(1, '2024-04-09', 45);

-- PRETS INTER-SERVICES (F-09)
INSERT INTO PRET_SERVICE (soignant_id, service_origine_id, service_destination_id, date_debut, date_fin) VALUES
(2, 1, 2, '2024-03-05 08:00:00', '2024-03-05 20:00:00'); -- Sophie a prêté main forte en cardio un jour.
