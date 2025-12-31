import sqlite3
from datetime import datetime

def init_database():
    """Create the database and tables if they don't exist"""
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()

    #Create devices table
    c.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            name TEXT,
            last_seen TEXT
        )
    ''')

    #Create tests table
    c.execute('''
        CREATE TABLE IF NOT EXISTS tests (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              device_id TEXT,
              test_type TEXT,
              target TEXT,
              timestamp TEXT,
              packet_loss INTEGER,
              rtt_avg REAL,
              rtt_min REAL,
              rtt_max REAL
              )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized!")

def register_device(device_id, name=None):
    """Register or update a device"""
    print(f"DEBUG: register_device called with device_id={device_id}")
    
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()
    
    # Check if exists
    c.execute('SELECT * FROM devices WHERE device_id = ?', (device_id,))
    existing = c.fetchone()
    
    if existing is None:
        # Create new device
        device_name = name or f"Device {device_id}"
        print(f"DEBUG: Creating new device {device_id}")
        c.execute('''
            INSERT INTO devices (device_id, name, last_seen)
            VALUES (?, ?, ?)
        ''', (device_id, device_name, datetime.now().isoformat()))
    else:
        # Update last_seen
        print(f"DEBUG: Updating device {device_id}")
        c.execute('''
            UPDATE devices SET last_seen = ? WHERE device_id = ?
        ''', (datetime.now().isoformat(), device_id))
    
    conn.commit()
    conn.close()

def save_test_results(device_id, test_type, target, results):
    """Save a test result to the database"""
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()

    c.execute('''
        INSERT INTO tests (device_id, test_type, target, timestamp, 
                          packet_loss, rtt_avg, rtt_min, rtt_max)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        device_id,
        test_type,
        target,
        datetime.now().isoformat(),
        results.get('packet_loss_percent', None),
        results.get('rtt_avg_ms', None),
        results.get('rtt_min_ms', None),
        results.get('rtt_max_ms', None)
    ))
                
              
    conn.commit()
    conn.close()

    return c.lastrowid

def get_all_tests(device_id=None, limit=50):
    """Get recent tests, optionally filtered by device"""
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()
    
    if device_id:
        c.execute('''
            SELECT * FROM tests 
            WHERE device_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (device_id, limit))
    else:
        c.execute('''
            SELECT * FROM tests 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
    
    results = c.fetchall()
    conn.close()
    return results

def get_devices():
    """Get all registered devices"""
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()
    
    c.execute('SELECT * FROM devices ORDER BY last_seen DESC')
    results = c.fetchall()
    conn.close()
    return results

def delete_device(device_id, delete_tests=True):
    """Delete a device and optionally its test results"""
    conn = sqlite3.connect('network_tests.db')
    c = conn.cursor()
    
    if delete_tests:
        # Delete all tests from this device first
        c.execute('DELETE FROM tests WHERE device_id = ?', (device_id,))
        print(f"Deleted tests for {device_id}")
    
    # Delete the device
    c.execute('DELETE FROM devices WHERE device_id = ?', (device_id,))
    print(f"Deleted device {device_id}")
    
    conn.commit()
    conn.close()

#Run this when the module is imported
init_database()