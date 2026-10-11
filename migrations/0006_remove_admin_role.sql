-- Existing ADMIN rows keep their accounts and projects, but become regular members.
UPDATE users
SET primary_role = 'INTEGRANTE'
WHERE primary_role = 'ADMIN';
