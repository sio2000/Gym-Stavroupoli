import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, Globe, FileText } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Πολιτική Απορρήτου
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Η προστασία των προσωπικών σας δεδομένων είναι η πρώτη μας προτεραιότητα
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Εισαγωγή
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Η εταιρεία GetFit SKG (εφεξής "εμείς", "μας" ή "η εταιρεία μας") αναγνωρίζει τη σημασία της προστασίας των προσωπικών σας δεδομένων. 
              Αυτή η Πολιτική Απορρήτου εξηγεί πώς συλλέγουμε, χρησιμοποιούμε, αποθηκεύουμε και προστατεύουμε τις πληροφορίες που μας παρέχετε 
              όταν χρησιμοποιείτε την εφαρμογή GetFit SKG.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Ποια Δεδομένα Συλλέγουμε
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Προσωπικά Στοιχεία
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Όνομα και επώνυμο</li>
                  <li>• Διεύθυνση ηλεκτρονικού ταχυδρομείου</li>
                  <li>• Αριθμός τηλεφώνου</li>
                  <li>• Ημερομηνία γέννησης</li>
                  <li>• Φύλο</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Δεδομένα Υγείας & Fitness
                </h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Στοιχεία συμμετοχής σε προγράμματα</li>
                  <li>• Ιστορικό κρατήσεων</li>
                  <li>• Προτιμήσεις προπόνησης</li>
                  <li>• Στοιχεία μέλους</li>
                  <li>• Στοιχεία πληρωμών</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Πώς Χρησιμοποιούμε τα Δεδομένα
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Υπηρεσίες</h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Παροχή υπηρεσιών γυμναστικής και διαχείριση μελών
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Επικοινωνία</h3>
                <p className="text-sm text-green-800 dark:text-green-400">
                  Ενημερώσεις για προγράμματα και ειδικές προσφορές
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Ανάλυση</h3>
                <p className="text-sm text-orange-800 dark:text-orange-400">
                  Βελτίωση των υπηρεσιών μας και προσωποποιημένες εμπειρίες
                </p>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Προστασία Δεδομένων
              </h2>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">
                    Τεχνικές Μέθοδοι
                  </h3>
                  <ul className="space-y-2 text-red-800 dark:text-red-400">
                    <li>• Κρυπτογράφηση SSL/TLS</li>
                    <li>• Ασφαλείς βάσεις δεδομένων</li>
                    <li>• Κανονιστικές πρόσβασης</li>
                    <li>• Ενημερωμένα συστήματα ασφαλείας</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">
                    Οργανωτικά Μέτρα
                  </h3>
                  <ul className="space-y-2 text-red-800 dark:text-red-400">
                    <li>• Εκπαίδευση προσωπικού</li>
                    <li>• Συμφωνίες εμπιστευτικότητας</li>
                    <li>• Επιθεώρηση πρόσβασης</li>
                    <li>• Επίπεδα εξουσιοδότησης</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Δικαιώματα Χρηστών
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mt-1">
                  <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Δικαίωμα Πρόσβασης</h3>
                  <p className="text-gray-700 dark:text-gray-300">Μπορείτε να ζητήσετε αντίγραφο των δεδομένων που διατηρούμε για εσάς.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mt-1">
                  <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Δικαίωμα Διόρθωσης</h3>
                  <p className="text-gray-700 dark:text-gray-300">Μπορείτε να ζητήσετε διόρθωση ανακριβών ή ελλιπών δεδομένων.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mt-1">
                  <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Δικαίωμα Διαγραφής</h3>
                  <p className="text-gray-700 dark:text-gray-300">Μπορείτε να ζητήσετε διαγραφή των δεδομένων σας σε ορισμένες περιπτώσεις.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full mt-1">
                  <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Δικαίωμα Αντιρρήσεως</h3>
                  <p className="text-gray-700 dark:text-gray-300">Μπορείτε να αντιτεθείτε στην επεξεργασία των δεδομένων σας.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-teal-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Κοινοποίηση Δεδομένων
              </h2>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-6">
              <p className="text-teal-900 dark:text-teal-300 mb-4">
                <strong>Δεν πουλάμε τα προσωπικά σας δεδομένα σε τρίτους.</strong> Μπορεί να κοινοποιήσουμε δεδομένα μόνο σε:
              </p>
              <ul className="space-y-2 text-teal-800 dark:text-teal-400">
                <li>• Πάροχους υπηρεσιών που μας βοηθούν να λειτουργήσουμε την πλατφόρμα</li>
                <li>• Αρχές επιβολής του νόμου όταν απαιτείται από νόμο</li>
                <li>• Σε περίπτωση συγχώνευσης ή εξαγοράς της εταιρείας</li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Cookies & Τοπική Αποθήκευση
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Χρησιμοποιούμε cookies και τοπική αποθήκευση για να βελτιώσουμε την εμπειρία σας. 
              Αυτά περιλαμβάνουν:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Απαραίτητα</h3>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Cookies για τη λειτουργία της εφαρμογής και την ασφάλεια
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Αναλυτικά</h3>
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Cookies για την ανάλυση χρήσης και τη βελτίωση υπηρεσιών
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Επικοινωνία
              </h2>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p className="text-blue-900 dark:text-blue-300 mb-4">
                Για οποιαδήποτε ερώτηση σχετικά με αυτή την Πολιτική Απορρήτου ή τα δεδομένα σας:
              </p>
              <div className="space-y-2 text-blue-800 dark:text-blue-400">
                <p><strong>Email:</strong> devtaskhub@gmail.com</p>
                <p><strong>Τηλέφωνο:</strong> +30 6971982563</p>
                <p><strong>Διεύθυνση:</strong> Θεσσαλονίκη, Ελλάδα</p>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Ενημερώσεις της Πολιτικής
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Μπορούμε να ενημερώσουμε αυτή την Πολιτική Απορρήτου κατά καιρούς. 
                Οι σημαντικές αλλαγές θα σας ενημερώσουμε μέσω email ή μέσω της εφαρμογής. 
                Συνεχίζοντας να χρησιμοποιείτε την υπηρεσία μας μετά από τέτοιες αλλαγές, 
                συμφωνείτε με την ενημερωμένη πολιτική.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} GetFit SKG. Όλα τα δικαιώματα διατηρούνται.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;