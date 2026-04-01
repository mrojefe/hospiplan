-- =========================================================================
-- HospiPlan - Script de Population (Seed)
-- D'après le schéma à 24 tables.
-- =========================================================================

-- ROLE
INSERT INTO role (id, name) VALUES
(1, 'Médecin'),
(2, 'Infirmier'),
(3, 'Aide-Soignant'),
(4, 'Stagiaire');

-- STAFF
INSERT INTO staff (id, first_name, last_name, email, phone, is_active) VALUES
(1, 'Jean', 'Dupont', 'j.dupont@alamal.ext', '0600010203', true),
(2, 'Sophie', 'Martin', 's.martin@alamal.ext', '0600010204', true),
(3, 'Amadou', 'Diop', 'a.diop@alamal.ext', '0600010205', true);

-- STAFF_ROLE
INSERT INTO staff_role (staff_id, role_id) VALUES
(1, 1), (2, 2), (3, 3);

-- SPECIALTY
INSERT INTO specialty (id, name, parent_id) VALUES
(1, 'Médecine Générale', NULL),
(2, 'Urgences', 1),
(3, 'Cardiologie', NULL);

-- STAFF_SPECIALTY
INSERT INTO staff_specialty (staff_id, specialty_id) VALUES
(1, 2), (1, 1), (2, 3);

-- CONTRACT_TYPE
INSERT INTO contract_type (id, name, max_hours_per_week, leave_days_per_year, night_shift_allowed) VALUES
(1, 'CDI Plein Temps', 35, 25, true),
(2, 'CDD', 35, 25, true),
(3, 'Stage', 35, 0, false);

-- CONTRACT
INSERT INTO contract (id, staff_id, contract_type_id, start_date, end_date, workload_percent) VALUES
(1, 1, 1, '2020-01-01', NULL, 100),
(2, 2, 1, '2022-01-01', NULL, 100),
(3, 3, 2, '2024-01-01', '2024-12-31', 80);

-- CERTIFICATION
INSERT INTO certification (id, name) VALUES
(1, 'BLS (Basic Life Support)'),
(2, 'ACLS (Advanced Cardiovascular Life Support)');

-- CERTIFICATION_DEPENDENCY
INSERT INTO certification_dependency (parent_cert_id, required_cert_id) VALUES
(2, 1);

-- STAFF_CERTIFICATION
INSERT INTO staff_certification (id, staff_id, certification_id, obtained_date, expiration_date) VALUES
(1, 1, 1, '2023-01-01', '2028-01-01'),
(2, 1, 2, '2023-06-01', '2028-06-01'),
(3, 2, 1, '2021-01-01', '2026-01-01');

-- SERVICE
INSERT INTO service (id, name, manager_id, bed_capacity, criticality_level) VALUES
(1, 'Urgences', 1, 30, 5),
(2, 'Cardiologie', NULL, 40, 3);

-- CARE_UNIT
INSERT INTO care_unit (id, service_id, name) VALUES
(1, 1, 'Triage'),
(2, 1, 'Déchoquage'),
(3, 2, 'Soins Continus');

-- SERVICE_STATUS
INSERT INTO service_status (id, service_id, status, start_date, end_date) VALUES
(1, 2, 'SOUS_EFFECTIF', '2024-03-01', '2024-03-15');

-- STAFF_SERVICE_ASSIGNMENT
INSERT INTO staff_service_assignment (id, staff_id, service_id, start_date, end_date) VALUES
(1, 1, 1, '2020-01-01', NULL),
(2, 2, 2, '2022-01-01', NULL);

-- SHIFT_TYPE
INSERT INTO shift_type (id, name, duration_hours, requires_rest_after) VALUES
(1, 'Jour (12h)', 12, true),
(2, 'Nuit (12h)', 12, true),
(3, 'Matin (8h)', 8, false);

-- SHIFT
INSERT INTO shift (id, care_unit_id, shift_type_id, start_datetime, end_datetime, min_staff, max_staff) VALUES
(1, 1, 1, '2024-04-10 08:00:00', '2024-04-10 20:00:00', 2, 4),
(2, 2, 2, '2024-04-10 20:00:00', '2024-04-11 08:00:00', 1, 2);

-- SHIFT_REQUIRED_CERTIFICATION
INSERT INTO shift_required_certification (shift_id, certification_id) VALUES
(2, 2); -- Déchoquage nécessite ACLS

-- SHIFT_ASSIGNMENT
INSERT INTO shift_assignment (id, shift_id, staff_id, assigned_at) VALUES
(1, 1, 1, '2024-04-01 10:00:00');

-- ABSENCE_TYPE
INSERT INTO absence_type (id, name, impacts_quota) VALUES
(1, 'Congés Payés', true),
(2, 'Maladie', true),
(3, 'Formation', false);

-- ABSENCE
INSERT INTO absence (id, staff_id, absence_type_id, start_date, expected_end_date, actual_end_date, is_planned) VALUES
(1, 3, 1, '2024-04-05', '2024-04-15', NULL, true);

-- PREFERENCE
INSERT INTO preference (id, staff_id, type, description, is_hard_constraint, start_date, end_date) VALUES
(1, 2, 'RELIGION', 'Indisponible les vendredis mâtin', true, '2024-01-01', '2025-01-01');

-- PATIENT_LOAD
INSERT INTO patient_load (id, care_unit_id, date, patient_count, occupancy_rate) VALUES
(1, 1, '2024-04-09', 25, 0.83);

-- STAFF_LOAN
INSERT INTO staff_loan (id, staff_id, from_service_id, to_service_id, start_date, end_date) VALUES
(1, 2, 2, 1, '2024-03-05', '2024-03-06');

-- RULE
INSERT INTO rule (id, name, description, rule_type, value, unit, valid_from, valid_to) VALUES
(1, 'Repos Minimum', '11h de repos obligatoire après une nuit', 'REST_TIME_POST_NIGHT', 11, 'hours', '2020-01-01', NULL),
(2, 'Heures Max', 'Code du travail: 48h max sur la semaine', 'MAX_WEEKLY_HOURS', 48, 'hours', '2020-01-01', NULL);
