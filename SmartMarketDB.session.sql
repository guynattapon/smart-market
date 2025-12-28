-- 1. สร้างตาราง Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TENANT')),
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. สร้างตาราง Zones
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

-- 3. สร้างตาราง Stalls
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    zone_id INT REFERENCES zones(id),
    code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'VACANT' CHECK (status IN ('VACANT', 'OCCUPIED', 'MAINTENANCE')),
    monthly_price DECIMAL(10, 2) NOT NULL,
    map_coordinates JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. สร้างตาราง Rentals
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES users(id),
    stall_id INT REFERENCES stalls(id),
    start_date DATE NOT NULL,
    end_date DATE,
    deposit_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. สร้างตาราง Bills
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    rental_id INT REFERENCES rentals(id),
    billing_month DATE NOT NULL,
    rent_fee DECIMAL(10, 2) NOT NULL,
    water_meter_old DECIMAL(10, 2),
    water_meter_new DECIMAL(10, 2),
    water_total DECIMAL(10, 2),
    electric_meter_old DECIMAL(10, 2),
    electric_meter_new DECIMAL(10, 2),
    electric_total DECIMAL(10, 2),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);