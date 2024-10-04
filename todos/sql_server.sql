

-- Customer: Contains the information of customers
-- customer_id – ID of the customer
-- first_name – First name of the customer
-- last_name – Last name of the customer
-- date_of_birth – Date of birth of the customer
-- gender – Gender of the customer
 


-- passengers: Contains information about the travel details
-- aircraft_id – ID of each aircraft in a brand
-- route_id – Route ID of from and to location
-- customer_id – ID of the customer
-- depart – Departure place from the airport
-- arrival – Arrival place in the airport
-- seat_num – Unique seat number for each passenger
-- class_id – ID of travel class
-- travel_date – Travel date of each passenger
-- flight_num – Specific flight number for each route
 
 
-- tickets: Contains information about the ticket details
-- p_date – Ticket purchase date
-- customer_id – ID of the customer
-- aircraft_id – ID of each aircraft in a brand
-- class_id – ID of travel class
-- no_of_tickets – Number of tickets purchased
-- a_code – Code of each airport
-- price_per_ticket – Price of a ticket
-- brand – Aviation service provider for each aircraft
 
-- routes: Contains information about the route details
-- Route_id – Route ID of from and to location
-- Flight_num – Specific fight number for each route
-- Origin_airport – Departure location
-- Destination_airport – Arrival location
-- Aircraft_id – ID of each aircraft in a brand
-- Distance_miles – Distance between departure and arrival location



-- 1. Write a query to create route details table using suitable data types for the fields, such as route_id, flight_num, origin_airport, destination_airport, aircraft_id, and distance_miles. Implement the check constraint for the flight number and unique constraint for the route_id fields. Also, make sure that the distance miles field is greater than 0.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'routes')
BEGIN
    CREATE TABLE routes (
        route_id INT PRIMARY KEY,
        flight_num INT CHECK (flight_num > 0),
        origin_airport VARCHAR(50),
        destination_airport VARCHAR(50),
        aircraft_id INT,
        distance_miles INT CHECK (distance_miles > 0),
        CONSTRAINT unique_route_id UNIQUE (route_id)
    );
END
GO


-- Add primary key constraints
ALTER TABLE Customers
ADD CONSTRAINT pk_customers_customer_id PRIMARY KEY (customer_id);

ALTER TABLE routes
ADD CONSTRAINT pk_routes_route_id PRIMARY KEY (route_id);

ALTER TABLE routes
ADD CONSTRAINT pk_routes_aircraft_id PRIMARY KEY (aircraft_id);



-- Add foreign key constraints to the passengers table
ALTER TABLE passengers
ADD CONSTRAINT fk_passengers_customer
FOREIGN KEY (customer_id) REFERENCES Customers(customer_id);

ALTER TABLE passengers
ADD CONSTRAINT fk_passengers_route
FOREIGN KEY (route_id) REFERENCES routes(route_id);

ALTER TABLE passengers
ADD CONSTRAINT fk_passengers_aircraft
FOREIGN KEY (aircraft_id) REFERENCES routes(aircraft_id);

-- Add foreign key constraints to the tickets table
ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_customer
FOREIGN KEY (customer_id) REFERENCES Customers(customer_id);

ALTER TABLE tickets
ADD CONSTRAINT fk_tickets_aircraft
FOREIGN KEY (aircraft_id) REFERENCES routes(aircraft_id);

-- Add foreign key constraints to the routes table
ALTER TABLE routes
ADD CONSTRAINT fk_routes_aircraft
FOREIGN KEY (aircraft_id) REFERENCES routes(aircraft_id);




-- Write a query to display all the passengers (customers) who have travelled in routes 01 to 25. Take data  from the passengers table.

SELECT * FROM passengers WHERE route_id BETWEEN 1 AND 25;


-- Write a query to identify the number of passengers and total revenue in business class from the tickets table.

SELECT COUNT(customer_id) AS total_passengers, SUM(price_per_ticket) AS total_revenue
FROM tickets
WHERE class_id = 'Business';




-- Write a query to display the full name of the customer by extracting the first name and last name from the customer table.

SELECT first_name + ' ' + last_name AS full_name FROM customers;
-- Write a query to extract the customers who have registered and booked a ticket. Use data from the customer and tickets tables.

SELECT c.first_name, c.last_name
FROM customers c
JOIN ticket t
ON c.customer_id = t.customer_id;


-- Write a query to identify the customer’s first name and last name based on their customer ID and brand (Emirates) from the tickets table.

SELECT c.first_name, c.last_name
FROM customers c
JOIN ticket t
ON c.customer_id = t.customer_id
WHERE t.brand = 'Emirates';


-- Write a query to identify the customers who have travelled by Economy Plus class using Group By and Having clause on the passengers table.

SELECT customer_id
FROM passengers
WHERE class_id = 'Economy Plus'
GROUP BY customer_id;


-- Write a query to identify whether the revenue has crossed 10000 using the IF clause on the tickets table.

SELECT CASE 
         WHEN SUM(price_per_ticket) > 10000 THEN 'Revenue crossed 10000'
         ELSE 'Revenue is less than 10000'
       END AS revenue_status 
FROM tickets;
-- Write a query to create and grant access to a new user to perform operations on a database.

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'new_user')
BEGIN
    CREATE LOGIN new_user WITH PASSWORD = 'password';
END;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'new_user')
BEGIN
    CREATE USER new_user FOR LOGIN new_user;
    EXEC sp_addrolemember 'db_datareader', 'new_user';
    EXEC sp_addrolemember 'db_datawriter', 'new_user';
END;

-- Write a query to find the maximum ticket price for each class using window functions on the tickets table.


SELECT class_id, MAX(price_per_ticket) OVER (PARTITION BY class_id) AS max_ticket_price 
FROM tickets;

-- Write a query to extract the passengers whose route ID is 4 by improving the speed and performance of the passengers table.
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_route_id' AND object_id = OBJECT_ID('passengers'))
BEGIN
    CREATE INDEX idx_route_id ON passengers(route_id);
END;

SELECT * FROM passengers WHERE route_id = 4;

--  For the route ID 4, write a query to view the execution plan of the passengers table.

GO

----- Enable the display of the execution plan
SET SHOWPLAN_ALL ON;
GO

----- The SELECT statement to analyze the execution plan
SELECT * FROM passengers WHERE route_id = 4;
GO

----- Disable the display of the execution plan
SET SHOWPLAN_ALL OFF;
GO

-- Write a query to calculate the total price of all tickets booked by a customer across different aircraft IDs using rollup function.

SELECT customer_id, aircraft_id, SUM(price_per_ticket) AS total_price
FROM tickets
GROUP BY ROLLUP (customer_id, aircraft_id);

-- Write a query to create a view with only business class customers along with the brand of airlines.

IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'business_class_customers')
BEGIN
    EXEC sp_executesql N'
    CREATE VIEW business_class_customers AS
    SELECT c.first_name, c.last_name, t.brand
    FROM customers c
    JOIN ticket t
    ON c.customer_id = t.customer_id
    WHERE t.class_id = ''Business''';
END
GO


-- Write a query to create a stored procedure to get the details of all passengers flying between a range of routes defined in run time. Also, return an error message if the table doesn't exist.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'get_passengers_by_route_range')
BEGIN
    EXEC sp_executesql N'
    CREATE PROCEDURE get_passengers_by_route_range
        @route_start INT,
        @route_end INT
    AS
    BEGIN
        IF EXISTS (SELECT * FROM sys.tables WHERE name = ''passengers'')
        BEGIN
            SELECT * FROM passengers WHERE route_id BETWEEN @route_start AND @route_end;
        END
        ELSE
        BEGIN
            SELECT ''Table does not exist'' AS error_message;
        END
    END';
END
GO

-- Write a query to create a stored procedure that extracts all the details from the routes table where the travelled distance is more than 2000 miles.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'get_long_distance_routes')
BEGIN
    EXEC sp_executesql N'
    CREATE PROCEDURE get_long_distance_routes
    AS
    BEGIN
        SELECT * FROM routes WHERE distance_miles > 2000;
    END';
END
GO


-- Write a query to create a stored procedure that groups the distance travelled by each flight into three categories. The categories are, short distance travel (SDT) for >=0 AND <= 2000 miles, intermediate distance travel (IDT) for >2000 AND <=6500, and long-distance travel (LDT) for >6500.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'categorize_distance_travelled')
BEGIN
    EXEC sp_executesql N'
    CREATE PROCEDURE categorize_distance_travelled
    AS
    BEGIN
        SELECT route_id, distance_miles,
        CASE
            WHEN distance_miles >= 0 AND distance_miles <= 2000 THEN ''Short Distance Travel (SDT)''
            WHEN distance_miles > 2000 AND distance_miles <= 6500 THEN ''Intermediate Distance Travel (IDT)''
            WHEN distance_miles > 6500 THEN ''Long Distance Travel (LDT)''
        END AS distance_category
        FROM routes;
    END';
END;
GO


-- Write a query to extract ticket purchase date, customer ID, class ID and specify if the complimentary services are provided for the specific class using a stored function in stored procedure on the ticket details table.
-- Condition:
-- If the class is Business and Economy Plus, then complimentary services are given as Yes, else it is No
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'check_complimentary_services')
BEGIN
    EXEC sp_executesql N'
    CREATE FUNCTION check_complimentary_services
        (@class_id VARCHAR(50))
    RETURNS VARCHAR(3)
    AS
    BEGIN
        DECLARE @complimentary_services VARCHAR(3);
        IF @class_id = ''Business'' OR @class_id = ''Economy Plus''
        BEGIN
            SET @complimentary_services = ''Yes'';
        END
        ELSE
        BEGIN
            SET @complimentary_services = ''No'';
        END
        RETURN @complimentary_services;
    END';
END;
GO

-- Write a query to extract the first record of the customer whose last name ends with Scott using a cursor from the customer table.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'C' AND name = 'customer_cursor')
BEGIN
    DECLARE @first_name VARCHAR(50);
    DECLARE @last_name VARCHAR(50);
    DECLARE customer_cursor CURSOR FOR
    SELECT first_name, last_name
    FROM customers
    WHERE last_name LIKE '%Scott';
END;
