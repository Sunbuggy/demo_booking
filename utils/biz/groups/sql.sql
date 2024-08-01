-- Postgres tables for Bookings

-- Bookings Table
CREATE TABLE Bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    status VARCHAR NOT NULL
);

-- Booking Details Table
CREATE TABLE BookingDetails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_type VARCHAR NOT NULL,
    booking_amount INT NOT NULL CHECK (booking_amount > 0),
    booking_date DATE NOT NULL
);

-- Customer Table
CREATE TABLE Customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    address VARCHAR NOT NULL
);

-- Vehicles Table
CREATE TABLE Vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    status VARCHAR NOT NULL
);

-- BookingVehicles Table
CREATE TABLE BookingVehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- Groups Table
CREATE TABLE Groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_DATE,
    created_by VARCHAR NOT NULL
);

-- GroupVehicles Table
CREATE TABLE GroupVehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- Alter tables to add foreign key references
ALTER TABLE Bookings
ADD COLUMN booking_details UUID REFERENCES BookingDetails(id);

ALTER TABLE BookingDetails
ADD COLUMN booking_id UUID REFERENCES Bookings(id);

ALTER TABLE BookingVehicles
ADD COLUMN booking_id UUID REFERENCES Bookings(id),
ADD COLUMN vehicle_id UUID REFERENCES Vehicles(id);

ALTER TABLE GroupVehicles
ADD COLUMN group_id UUID REFERENCES Groups(id),
ADD COLUMN booking_id UUID REFERENCES Bookings(id),
ADD COLUMN vehicle_id UUID REFERENCES Vehicles(id);

-- alter vehicles table to add description column
ALTER TABLE Vehicles
ADD COLUMN description TEXT;



-- Create an sql statement for the above insert statements
INSERT INTO Vehicles (name, description, type, status) VALUES
('QA', 'Honda ATV', 'ATV', 'active'),
('QB', 'Yamaha ATV', 'ATV', 'active'),
('QU', 'Medium 2wd ATV', 'ATV', 'active'),
('QL', 'Luxury ATV', 'ATV', 'active'),
('twoSeat4wd', '2 Seat 4WD ATV', 'ATV', 'active'),
('SB1', 'one seater', 'BUGGY', 'active'),
('SB2', 'two seater', 'BUGGY', 'active'),
('SB4', 'four seater', 'BUGGY', 'active'),
('SB5', 'five seater', 'BUGGY', 'active'),
('SB6', 'six seater', 'BUGGY', 'active'),
('UZ2', '2 seat UTV', 'UTV', 'inactive'),
('UZ4', '4 seat UTV', 'UTV', 'inactive'),
('RWG', 'Ride with Guide', 'ANY', 'active'),
('GoKartplus', 'GoKart plus', 'GOCART', 'inactive'),
('GoKart', 'GoKart', 'GOCART', 'inactive');
