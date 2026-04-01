-- =========================================================================
-- HospiPlan - Script de Création du Schéma (Phase 1)
-- Modèle : 24 tables (Anglais) d'après la proposition pédagogique
-- =========================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

CREATE TABLE staff ( 
    id SERIAL PRIMARY KEY, 
    first_name VARCHAR(100) NOT NULL, 
    last_name VARCHAR(100) NOT NULL, 
    email VARCHAR(255) UNIQUE NOT NULL, 
    phone VARCHAR(20), 
    is_active BOOLEAN DEFAULT true, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE role ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL 
); 

CREATE TABLE staff_role ( 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    role_id INT NOT NULL REFERENCES role(id) ON DELETE CASCADE, 
    PRIMARY KEY (staff_id, role_id) 
); 

CREATE TABLE specialty ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    parent_id INT REFERENCES specialty(id) ON DELETE SET NULL 
); 

CREATE TABLE staff_specialty ( 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    specialty_id INT NOT NULL REFERENCES specialty(id) ON DELETE CASCADE, 
    PRIMARY KEY (staff_id, specialty_id) 
); 

CREATE TABLE contract_type ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50) NOT NULL, 
    max_hours_per_week INT, 
    leave_days_per_year INT, 
    night_shift_allowed BOOLEAN DEFAULT true 
); 

CREATE TABLE contract ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    contract_type_id INT NOT NULL REFERENCES contract_type(id), 
    start_date DATE NOT NULL, 
    end_date DATE, 
    workload_percent INT DEFAULT 100 
); 

CREATE TABLE certification ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(150) NOT NULL 
); 

CREATE TABLE certification_dependency ( 
    parent_cert_id INT NOT NULL REFERENCES certification(id) ON DELETE CASCADE, 
    required_cert_id INT NOT NULL REFERENCES certification(id) ON DELETE CASCADE, 
    PRIMARY KEY (parent_cert_id, required_cert_id) 
); 

CREATE TABLE staff_certification ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    certification_id INT NOT NULL REFERENCES certification(id) ON DELETE CASCADE, 
    obtained_date DATE NOT NULL, 
    expiration_date DATE 
); 

CREATE TABLE service ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    manager_id INT REFERENCES staff(id) ON DELETE SET NULL, 
    bed_capacity INT NOT NULL, 
    criticality_level INT DEFAULT 1 
); 

CREATE TABLE care_unit ( 
    id SERIAL PRIMARY KEY, 
    service_id INT NOT NULL REFERENCES service(id) ON DELETE CASCADE, 
    name VARCHAR(100) NOT NULL 
); 

CREATE TABLE service_status ( 
    id SERIAL PRIMARY KEY, 
    service_id INT NOT NULL REFERENCES service(id) ON DELETE CASCADE, 
    status VARCHAR(50) NOT NULL, 
    start_date DATE NOT NULL, 
    end_date DATE 
); 

CREATE TABLE staff_service_assignment ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    service_id INT NOT NULL REFERENCES service(id) ON DELETE CASCADE, 
    start_date DATE NOT NULL, 
    end_date DATE 
); 

CREATE TABLE shift_type ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50) NOT NULL, 
    duration_hours INT NOT NULL, 
    requires_rest_after BOOLEAN DEFAULT true 
); 

CREATE TABLE shift ( 
    id SERIAL PRIMARY KEY, 
    care_unit_id INT NOT NULL REFERENCES care_unit(id) ON DELETE CASCADE, 
    shift_type_id INT NOT NULL REFERENCES shift_type(id), 
    start_datetime TIMESTAMP NOT NULL, 
    end_datetime TIMESTAMP NOT NULL, 
    min_staff INT DEFAULT 1, 
    max_staff INT 
); 

CREATE TABLE shift_required_certification ( 
    shift_id INT NOT NULL REFERENCES shift(id) ON DELETE CASCADE, 
    certification_id INT NOT NULL REFERENCES certification(id) ON DELETE CASCADE, 
    PRIMARY KEY (shift_id, certification_id) 
); 

CREATE TABLE shift_assignment ( 
    id SERIAL PRIMARY KEY, 
    shift_id INT NOT NULL REFERENCES shift(id) ON DELETE CASCADE, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT, 
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE absence_type ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50) NOT NULL, 
    impacts_quota BOOLEAN DEFAULT true 
); 

CREATE TABLE absence ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    absence_type_id INT NOT NULL REFERENCES absence_type(id), 
    start_date DATE NOT NULL, 
    expected_end_date DATE NOT NULL, 
    actual_end_date DATE, 
    is_planned BOOLEAN DEFAULT true 
); 

CREATE TABLE preference ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    type VARCHAR(50), 
    description TEXT, 
    is_hard_constraint BOOLEAN DEFAULT false, 
    start_date DATE NOT NULL, 
    end_date DATE 
); 

CREATE TABLE patient_load ( 
    id SERIAL PRIMARY KEY, 
    care_unit_id INT NOT NULL REFERENCES care_unit(id) ON DELETE CASCADE, 
    date DATE NOT NULL, 
    patient_count INT NOT NULL, 
    occupancy_rate FLOAT 
); 

CREATE TABLE staff_loan ( 
    id SERIAL PRIMARY KEY, 
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE, 
    from_service_id INT NOT NULL REFERENCES service(id) ON DELETE CASCADE, 
    to_service_id INT NOT NULL REFERENCES service(id) ON DELETE CASCADE, 
    start_date DATE NOT NULL, 
    end_date DATE NOT NULL 
); 

CREATE TABLE rule ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    description TEXT, 
    rule_type VARCHAR(50), 
    value NUMERIC NOT NULL, 
    unit VARCHAR(20), 
    valid_from DATE NOT NULL, 
    valid_to DATE 
);
