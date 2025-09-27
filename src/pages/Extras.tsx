import React from 'react';
import { 
  Star,
  Heart,
  MapPin,
  ExternalLink,
  Users,
  Baby,
  Smile,
  ArrowRight,
  Sparkles,
  Home,
  Phone,
  Globe
} from 'lucide-react';

const Extras: React.FC = () => {
  const handlePlaygroundVisit = () => {
    // Open playground website in new tab
    window.open('https://68d754f3847dbc00088417e0--tassulashop.netlify.app/', '_blank');
  };

  // CSS Animation styles
  const animationStyles = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
    
    .animate-fadeInUp {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .animate-fadeInScale {
      animation: fadeInScale 0.4s ease-out forwards;
    }
    
    .animate-slideInLeft {
      animation: slideInLeft 0.5s ease-out forwards;
    }
    
    .animate-slideInRight {
      animation: slideInRight 0.5s ease-out forwards;
    }
    
    .animate-bounce {
      animation: bounce 1s ease-in-out;
    }
    
    .animate-pulse {
      animation: pulse 2s ease-in-out infinite;
    }
    
    .animate-float {
      animation: float 3s ease-in-out infinite;
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        {/* Hero Section */}
        <div 
          className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-pink-800 to-blue-900 rounded-3xl p-6 sm:p-8 lg:p-12 text-white animate-fadeInUp"
          style={{ opacity: 0 }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full translate-y-24 -translate-x-24 animate-float"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="inline-flex items-center space-x-3 mb-6">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm animate-float">
                    <Baby className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold">Επιπλέον Υπηρεσίες</h1>
                    <div className="flex items-center space-x-2 mt-2">
                      <Sparkles className="h-5 w-5 text-yellow-300" />
                      <span className="text-purple-200">Για εσάς και την οικογένειά σας</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-lg sm:text-xl text-purple-100 leading-relaxed mb-8 max-w-2xl">
                  Το γυμναστήριο <strong className="text-white">"Get Fit"</strong> σε συνεργασία με τον χώρο για τα παιδιά 
                  <strong className="text-white"> "Μικροί Κύριοι, Μικρές Κυρίες"</strong> σας προσφέρει 
                  την ιδανική λύση για να προπονηθείτε με ηρεμία!
                </p>
                
                <button
                  onClick={handlePlaygroundVisit}
                  className="bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 sm:space-x-3 shadow-2xl mx-auto lg:mx-0 animate-pulse w-full sm:w-auto"
                >
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm sm:text-base">Επισκεφτείτε τον Παιδότοπο</span>
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
              
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-float">
                    <div className="text-center text-white">
                      <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🏠</div>
                      <div className="text-xs sm:text-sm font-semibold">Μόλις 1 λεπτό<br/>μακριά!</div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div 
          className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-3xl p-6 sm:p-8 lg:p-12 text-white animate-fadeInUp"
          style={{ opacity: 0, animationDelay: '0.2s' }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">Πώς Λειτουργεί;</h2>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Απλό, γρήγορο και ασφαλές για εσάς και το παιδί σας
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div 
              className="text-center animate-slideInLeft"
              style={{ opacity: 0, animationDelay: '0.3s' }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Phone className="h-3 w-3 text-yellow-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Επικοινωνία</h3>
              <p className="text-gray-300 leading-relaxed">
                Επικοινωνήστε με τον χώρο για τα παιδιά <strong>"Μικροί Κύριοι, Μικρές Κυρίες"</strong> 
                για να κλείσετε ραντεβού φύλαξης.
              </p>
            </div>

            <div 
              className="text-center animate-fadeInUp"
              style={{ opacity: 0, animationDelay: '0.4s' }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center">
                  <Heart className="h-3 w-3 text-pink-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Προπόνηση</h3>
              <p className="text-gray-300 leading-relaxed">
                Αφήστε το παιδί σας στον χώρο για τα παιδιά και προπονηθείτε με ηρεμία 
                στο γυμναστήριο Get Fit.
              </p>
            </div>

            <div 
              className="text-center animate-slideInRight"
              style={{ opacity: 0, animationDelay: '0.5s' }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Smile className="h-3 w-3 text-blue-800" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Συλλογή</h3>
              <p className="text-gray-300 leading-relaxed">
                Συλλέξτε το χαρούμενο παιδί σας μετά την προπόνηση. 
                Και οι δύο θα είστε ικανοποιημένοι!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div 
          className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-3xl p-6 sm:p-8 lg:p-12 text-white text-center animate-fadeInUp"
          style={{ opacity: 0, animationDelay: '0.6s' }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-4xl sm:text-6xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Έτοιμοι να Ξεκινήσετε;
            </h2>
            <p className="text-orange-100 text-lg sm:text-xl mb-8 leading-relaxed">
              Μην αφήσετε την φροντίδα του παιδιού να σας εμποδίσει από την προπόνηση. 
              Επικοινωνήστε με τον χώρο για τα παιδιά και ξεκινήστε σήμερα!
            </p>
            <button
              onClick={handlePlaygroundVisit}
              className="bg-white text-orange-600 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 sm:space-x-3 shadow-2xl mx-auto animate-pulse w-full sm:w-auto"
            >
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base">Επισκεφτείτε τον Παιδότοπο</span>
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div 
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 sm:p-8 lg:p-12 text-white animate-fadeInUp"
          style={{ opacity: 0, animationDelay: '0.7s' }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <Home className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Πληροφορίες Επικοινωνίας</h2>
            </div>
            <p className="text-gray-300 text-lg">
              Για περισσότερες πληροφορίες και κρατήσεις
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="text-center bg-gray-700/50 rounded-2xl p-8 hover:bg-gray-700/70 transition-all duration-300 hover:scale-105">
              <div className="p-4 bg-blue-600/20 rounded-2xl inline-block mb-6">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="font-bold text-xl mb-4">Μικροί Κύριοι, Μικρές Κυρίες</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Επισκεφτείτε τον ιστότοπό μας για περισσότερες πληροφορίες 
                σχετικά με τις υπηρεσίες φύλαξης παιδιών
              </p>
              <button
                onClick={handlePlaygroundVisit}
                className="text-blue-400 hover:text-blue-300 transition-colors font-semibold flex items-center space-x-2 mx-auto hover:scale-105"
              >
                <span>Μικροί Κύριοι, Μικρές Κυρίες</span>
                <ExternalLink className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center bg-gray-700/50 rounded-2xl p-8 hover:bg-gray-700/70 transition-all duration-300 hover:scale-105">
              <div className="p-4 bg-purple-600/20 rounded-2xl inline-block mb-6">
                <Star className="h-12 w-12 text-purple-400" />
              </div>
              <h3 className="font-bold text-xl mb-4">Get Fit Gym</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Το γυμναστήριό μας που συνεργάζεται με τον χώρο για τα παιδιά 
                για την καλύτερη εμπειρία προπόνησης
              </p>
              <div className="flex items-center justify-center space-x-3 text-purple-400">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Μαιάνδρου 43, Κορδελιό Εύοσμος</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Extras;