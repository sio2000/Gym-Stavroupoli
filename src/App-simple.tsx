import React, { useState } from 'react';
import './index-simple.css';

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      setIsLoggedIn(true);
      alert('Σύνδεση επιτυχής! Email: ' + email);
    } else {
      alert('Παρακαλώ συμπληρώστε όλα τα πεδία');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  if (isLoggedIn) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>🏋️‍♂️</div>
          <h1 style={{ fontSize: '2.5em', margin: '0 0 20px 0' }}>FreeGym</h1>
          
          <div className="status">
            <h3>✅ Καλώς ήρθες!</h3>
            <p>Συνδεθήκατε επιτυχώς ως: {email}</p>
          </div>
          
          <div className="feature">
            <strong>📱 Mobile App:</strong> Εφαρμογή για Android & iOS
          </div>
          <div className="feature">
            <strong>🏋️‍♂️ Διαχείριση Γυμναστηρίου:</strong> Μέλη, συνδρομές, προγράμματα
          </div>
          <div className="feature">
            <strong>📊 Dashboard:</strong> Στατιστικά και αναφορές
          </div>
          <div className="feature">
            <strong>🔐 Ασφάλεια:</strong> Αυθεντικοποίηση χρηστών
          </div>
          
          <button className="btn" onClick={handleLogout}>
            🚪 Αποσύνδεση
          </button>
          
          <a href="https://www.getfitskg.com" className="btn" target="_blank">
            🌐 Άνοιγμα Web Site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ fontSize: '3em', marginBottom: '20px' }}>🏋️‍♂️</div>
        <h1 style={{ fontSize: '2.5em', margin: '0 0 20px 0' }}>FreeGym</h1>
        
        <div className="status">
          <h3>✅ Η Εφαρμογή Λειτουργεί!</h3>
          <p>Το FreeGym είναι έτοιμο για χρήση!</p>
        </div>
        
        <div style={{ margin: '30px 0', textAlign: 'left' }}>
          <h3>🔐 Σύνδεση</h3>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Κωδικός:</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn" onClick={handleLogin}>
            🚀 Σύνδεση
          </button>
        </div>
        
        <div className="feature">
          <strong>📱 Mobile App:</strong> Εφαρμογή για Android & iOS
        </div>
        <div className="feature">
          <strong>🏋️‍♂️ Διαχείριση Γυμναστηρίου:</strong> Μέλη, συνδρομές, προγράμματα
        </div>
        <div className="feature">
          <strong>📊 Dashboard:</strong> Στατιστικά και αναφορές
        </div>
        <div className="feature">
          <strong>🔐 Ασφάλεια:</strong> Αυθεντικοποίηση χρηστών
        </div>
        
        <p><strong>Για πλήρη λειτουργία, χρησιμοποιήστε το web browser:</strong></p>
        
        <a href="https://www.getfitskg.com" className="btn" target="_blank">
          🌐 Άνοιγμα Web Site
        </a>
        
        <button className="btn" onClick={() => alert('Για πλήρη λειτουργία, χρησιμοποιήστε το web browser στο https://www.getfitskg.com')}>
          🔄 Δοκιμή Εφαρμογής
        </button>
        
        <p style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '30px' }}>
          FreeGym Mobile App v1.0<br/>
          Για υποστήριξη: info@freegym.com
        </p>
      </div>
    </div>
  );
};

export default App;
