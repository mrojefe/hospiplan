-- =========================================================================
-- HospiPlan - Script de Création du Schéma (Phase 1)
-- Dialecte : PostgreSQL
-- Description : Définition des DDL, clés, contraintes d'intégrité (3NF)
-- =========================================================================

-- Re-création complète (Drop des tables si existantes)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 1. Référentiels et Configuration

CREATE TABLE REGLE_LEGALE (
    code VARCHAR(50) PRIMARY KEY,
    description TEXT,
    valeur_numerique NUMERIC(10,2) NOT NULL,
    unite VARCHAR(20) NOT NULL
);

CREATE TABLE GRADE (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL UNIQUE,
    eligibilite_garde_nuit BOOLEAN DEFAULT TRUE
);

CREATE TABLE SPECIALITE (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    parent_id INT REFERENCES SPECIALITE(id) ON DELETE SET NULL
);

-- 2. Entités de Base Personnels

CREATE TABLE SOIGNANT (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    telephone VARCHAR(20),
    is_actif BOOLEAN NOT NULL DEFAULT TRUE,
    grade_id INT NOT NULL REFERENCES GRADE(id)
);

CREATE TABLE SOIGNANT_SPECIALITE (
    soignant_id INT REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    specialite_id INT REFERENCES SPECIALITE(id) ON DELETE CASCADE,
    PRIMARY KEY(soignant_id, specialite_id)
);

CREATE TABLE CONTRAT (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    type_contrat VARCHAR(50) NOT NULL, -- 'CDI', 'CDD', 'INTERIM', 'STAGE'...
    date_debut DATE NOT NULL,
    date_fin DATE, -- NULL = Contrat en cours
    pourcentage_tps_travail NUMERIC(3,2) NOT NULL CHECK(pourcentage_tps_travail > 0 AND pourcentage_tps_travail <= 1.0),
    heures_max_hebdo NUMERIC(4,1),
    CONSTRAINT chk_dates_contrat CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- 3. Compétences & Formations

CREATE TABLE CERTIFICATION (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL,
    prerequis_id INT REFERENCES CERTIFICATION(id) ON DELETE SET NULL
);

CREATE TABLE SOIGNANT_CERTIFICATION (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    certification_id INT NOT NULL REFERENCES CERTIFICATION(id) ON DELETE CASCADE,
    date_obtention DATE NOT NULL,
    date_expiration DATE, -- Si NULL, certif permanente
    CONSTRAINT chk_dates_certif CHECK (date_expiration IS NULL OR date_expiration >= date_obtention)
);

-- 4. Structure Hospitalière

CREATE TABLE SERVICE (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    capacite_lits INT NOT NULL CHECK(capacite_lits >= 0),
    niveau_criticite INT DEFAULT 1,
    soignant_responsable_id INT REFERENCES SOIGNANT(id) ON DELETE SET NULL
);

CREATE TABLE ETAT_SERVICE (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES SERVICE(id) ON DELETE CASCADE,
    statut VARCHAR(20) NOT NULL, -- 'OUVERT', 'FERME', 'SOUS_EFFECTIF'
    date_debut DATE NOT NULL,
    date_fin DATE,
    CONSTRAINT chk_dates_etat_service CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE TABLE UNITE_SOIN (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL REFERENCES SERVICE(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL
);

CREATE TABLE SOIGNANT_SERVICE (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES SERVICE(id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    date_fin DATE,
    CONSTRAINT chk_dates_soignant_service CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

CREATE TABLE CHARGE_PATIENTE (
    id SERIAL PRIMARY KEY,
    unite_id INT NOT NULL REFERENCES UNITE_SOIN(id) ON DELETE CASCADE,
    date_releve DATE NOT NULL,
    nombre_patients INT NOT NULL CHECK(nombre_patients >= 0),
    UNIQUE(unite_id, date_releve) -- Un seul relevé par jour et par unité
);

-- 5. Planification et Gardes

CREATE TABLE TYPE_GARDE (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL,
    is_nuit BOOLEAN DEFAULT FALSE,
    is_astreinte BOOLEAN DEFAULT FALSE,
    duree_standard_heures NUMERIC(4,2) NOT NULL
);

CREATE TABLE POSTE_GARDE (
    id SERIAL PRIMARY KEY,
    unite_id INT NOT NULL REFERENCES UNITE_SOIN(id) ON DELETE CASCADE,
    type_garde_id INT NOT NULL REFERENCES TYPE_GARDE(id),
    debut_prevu TIMESTAMP NOT NULL,
    fin_prevue TIMESTAMP NOT NULL,
    nb_soignants_min INT NOT NULL DEFAULT 1 CHECK(nb_soignants_min >= 0),
    nb_soignants_max INT NOT NULL DEFAULT 1 CHECK(nb_soignants_max >= nb_soignants_min),
    CONSTRAINT chk_dates_poste CHECK (fin_prevue > debut_prevu)
);

CREATE TABLE POSTE_CERTIFICATION_REQUISE (
    poste_id INT REFERENCES POSTE_GARDE(id) ON DELETE CASCADE,
    certification_id INT REFERENCES CERTIFICATION(id) ON DELETE CASCADE,
    PRIMARY KEY(poste_id, certification_id)
);

CREATE TABLE AFFECTATION (
    id SERIAL PRIMARY KEY,
    poste_id INT NOT NULL REFERENCES POSTE_GARDE(id) ON DELETE CASCADE,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE RESTRICT,
    statut VARCHAR(20) NOT NULL DEFAULT 'VALIDE', -- 'VALIDE', 'ANNULE'
    UNIQUE(poste_id, soignant_id) -- Un soignant ne peut être affecté qu'une fois au même poste
);

-- 6. Événements Vie Soignant (Absences, Prêts, Contraintes)

CREATE TABLE TYPE_ABSENCE (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL,
    impacte_quota_garde BOOLEAN DEFAULT TRUE
);

CREATE TABLE ABSENCE (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    type_absence_id INT NOT NULL REFERENCES TYPE_ABSENCE(id),
    date_debut DATE NOT NULL,
    date_fin_prevue DATE NOT NULL,
    date_fin_reelle DATE,
    CONSTRAINT chk_dates_absence CHECK (date_fin_prevue >= date_debut)
);

CREATE TABLE CONTRAINTE_SOIGNANT (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    est_imperative BOOLEAN DEFAULT FALSE,
    datetime_debut TIMESTAMP NOT NULL,
    datetime_fin TIMESTAMP NOT NULL,
    valide_jusqu_au DATE, -- null équivaut à toujours valide
    CONSTRAINT chk_dates_contrainte CHECK (datetime_fin > datetime_debut)
);

CREATE TABLE PRET_SERVICE (
    id SERIAL PRIMARY KEY,
    soignant_id INT NOT NULL REFERENCES SOIGNANT(id) ON DELETE CASCADE,
    service_origine_id INT NOT NULL REFERENCES SERVICE(id),
    service_destination_id INT NOT NULL REFERENCES SERVICE(id),
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP,
    CONSTRAINT chk_services_differents CHECK (service_origine_id != service_destination_id)
);


-- INDEXES OPTIMISÉS POUR LES REQUÊTES Q-01 à Q-07
CREATE INDEX idx_absence_soignant_dates ON ABSENCE(soignant_id, date_debut);
CREATE INDEX idx_poste_garde_dates ON POSTE_GARDE(debut_prevu, fin_prevue);
CREATE INDEX idx_soignant_certif_dates ON SOIGNANT_CERTIFICATION(soignant_id, certification_id, date_expiration);
CREATE INDEX idx_affectation_poste_soignant ON AFFECTATION(poste_id, soignant_id);
CREATE INDEX idx_charge_patiente_date ON CHARGE_PATIENTE(unite_id, date_releve);
