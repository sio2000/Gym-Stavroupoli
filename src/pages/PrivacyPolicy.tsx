import React from 'react';
import { Shield, Scale, Lock, FileText, Globe, CheckCircle2, Clock } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Όροι Χρήσης &amp; Πολιτική Απορρήτου (GDPR)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Τελευταία ενημέρωση: {new Date().toLocaleDateString('el-GR')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-10">
          {/* 1 */}
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                1. Υπεύθυνος Επεξεργασίας & Στοιχεία Επιχείρησης
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Η επιχείρηση <strong>GetFit</strong>, Μαιάνδρου 43, Κορδελιό Εύοσμος, Ελλάδα, είναι ο Υπεύθυνος Επεξεργασίας για όλα τα δεδομένα
              που συλλέγονται μέσω της εφαρμογής και των υπηρεσιών μας.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-gray-700 dark:text-gray-300">
              <li>Email επικοινωνίας/DPO: <a className="text-blue-600 dark:text-blue-300 underline" href="mailto:getfit.skg@gmail.com">getfit.skg@gmail.com</a></li>
              <li>Διεύθυνση: Μαιάνδρου 43, Κορδελιό Εύοσμος</li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-emerald-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                2. Νομικές Βάσεις Επεξεργασίας (GDPR)
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Εκτέλεση σύμβασης: διαχείριση λογαριασμού, κρατήσεις, συνδρομές, πληρωμές, έλεγχος πρόσβασης (QR/κάρτα).</li>
              <li>Νομική υποχρέωση: τιμολόγηση, φορολογική/λογιστική συμμόρφωση, ασφάλεια εγκαταστάσεων.</li>
              <li>Έννομο συμφέρον: ασφάλεια συστημάτων, αποτροπή απάτης/κατάχρησης, βελτίωση υπηρεσίας (με ελαχιστοποίηση &amp; κατάλληλες εγγυήσεις).</li>
              <li>Συγκατάθεση: προαιρετικές ενημερώσεις/προσφορές, cookies ανάλυσης ή marketing όπου απαιτείται.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                3. Δεδομένα που Συλλέγουμε
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Απαραίτητα στοιχεία λογαριασμού</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Όνομα, επώνυμο, email, προαιρετικό τηλέφωνο.</li>
                  <li>Στοιχεία πρόσβασης (hash κωδικού, tokens συνεδρίας).</li>
                  <li>Στοιχεία τιμολόγησης/πληρωμών (δεν κρατάμε πλήρη στοιχεία κάρτας στη δική μας υποδομή).</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Λειτουργικά & υγείας/fitness</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Κρατήσεις, συμμετοχή σε προγράμματα, ιστορικό επισκέψεων.</li>
                  <li>Προτιμήσεις προπόνησης, επιλεγμένα πακέτα/συνδρομές, προσφορές/δόσεις όπου ισχύει.</li>
                  <li>Στοιχεία υγείας που παρέχονται οικειοθελώς για ασφάλεια/καταλληλότητα προγραμμάτων.</li>
                  <li>Τεχνικά δεδομένα χρήσης (IP, συσκευή, browser, logs ασφαλείας) για προστασία και εύρυθμη λειτουργία.</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Εφαρμόζουμε αρχή ελαχιστοποίησης και συλλέγουμε μόνο τα απολύτως αναγκαία δεδομένα.
            </p>
          </section>

          {/* 4 */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                4. Σκοποί Χρήσης Δεδομένων
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Δημιουργία/διαχείριση λογαριασμού, ταυτοποίηση χρήστη, έλεγχος πρόσβασης (π.χ. QR/κάρτα).</li>
              <li>Κρατήσεις, προγράμματα, συνδρομές, έκδοση αποδείξεων/τιμολογίων, διαχείριση δόσεων όπου παρέχονται.</li>
              <li>Υποστήριξη πελατών, απαντήσεις σε αιτήματα, λειτουργική επικοινωνία.</li>
              <li>Ασφάλεια εφαρμογής: καταγραφή συμβάντων, ανίχνευση κακόβουλης χρήσης, backup.</li>
              <li>Βελτίωση υπηρεσίας και στατιστική ανάλυση με ανωνυμοποιημένα/συγκεντρωτικά δεδομένα όπου είναι δυνατό.</li>
              <li>Εμπορικές επικοινωνίες/newsletters μόνο με ρητή συγκατάθεση.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                5. Cookies & Τοπική Αποθήκευση
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Χρησιμοποιούμε:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              <li>Απαραίτητα cookies για σύνδεση, ασφάλεια, διαχείριση συνεδρίας.</li>
              <li>Cookies προτιμήσεων (π.χ. γλώσσα/θέμα εμφάνισης).</li>
              <li>Αναλυτικά/απόδοσης μόνο με ελαχιστοποίηση και, όπου απαιτείται, με συγκατάθεση.</li>
            </ul>
          </section>

          {/* 5α */}
          <section>
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                5α. Τοποθεσία Δεδομένων &amp; Ρόλοι
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Ο GetFit είναι Υπεύθυνος Επεξεργασίας. Πάροχοι (hosting/Supabase, email/SMS, πληρωμές) είναι Εκτελούντες με συμβάσεις άρθρου 28.</li>
              <li>Δεδομένα μπορεί να φιλοξενούνται εντός/εκτός ΕΟΧ. Για εκτός ΕΟΧ εφαρμόζονται SCCs και τεχνικά μέτρα (κρυπτογράφηση, ελαχιστοποίηση).</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-teal-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                6. Εκτελούντες Επεξεργασία & Διαβιβάσεις
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Δεν πωλούμε δεδομένα. Διαβιβάζουμε μόνο σε εκτελούντες επεξεργασία με συμβάσεις GDPR (άρθρο 28) και κατάλληλες εγγυήσεις:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Πάροχοι hosting/infrastructure, βάσεων δεδομένων, backup.</li>
              <li>Πάροχοι email/SMS/push για λειτουργικές ειδοποιήσεις.</li>
              <li>Πάροχοι πληρωμών/τιμολόγησης (PCI-DSS) – δεν τηρούμε εμείς πλήρη στοιχεία κάρτας.</li>
              <li>Analytics/σφάλματα με ψευδωνυμοποίηση όπου είναι δυνατό.</li>
              <li>Νομικοί/λογιστές και αρμόδιες αρχές όπου απαιτείται από νόμο.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-indigo-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                7. Διαβιβάσεις Εκτός ΕΟΧ
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Αν συνεργάτες εδρεύουν ή αποθηκεύουν δεδομένα εκτός ΕΟΧ, εφαρμόζουμε Τυποποιημένες Συμβατικές Ρήτρες (SCCs),
              κρυπτογράφηση και αρχές ελαχιστοποίησης ώστε να διασφαλίζεται επαρκές επίπεδο προστασίας.
            </p>
          </section>

          {/* 8 */}
          <section>
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-orange-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                8. Χρόνος Τήρησης
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Δεδομένα λογαριασμού/σύμβασης: όσο διαρκεί ο λογαριασμός και έως 6 έτη για φορολογικές/νομικές υποχρεώσεις.</li>
              <li>Logs ασφαλείας: συνήθως έως 12 μήνες, εκτός αν απαιτείται παράταση για διερεύνηση.</li>
              <li>Marketing με συγκατάθεση: έως ανάκληση της συγκατάθεσης.</li>
              <li>Δεδομένα υγείας: μόνο για τον απολύτως αναγκαίο χρόνο παροχής υπηρεσίας και σύμφωνα με σχετικές υποχρεώσεις.</li>
            </ul>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Δείγμα πίνακα τήρησης (κατηγορία → σκοπός/βάση → χρόνος → αποδέκτες): Λογαριασμός/σύμβαση → παροχή υπηρεσίας/εκτέλεση → διάρκεια λογαριασμού + 6 έτη (φορολογικά) → πάροχοι φιλοξενίας· Logs → ασφάλεια/έννομο συμφέρον → 12 μήνες → πάροχοι φιλοξενίας· Marketing → συγκατάθεση → έως ανάκληση → email/SMS πάροχοι.
            </p>
          </section>

          {/* 9 */}
          <section>
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9. Ασφάλεια Δεδομένων
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Κρυπτογράφηση σε μεταφορά (TLS) και, όπου είναι δυνατό, σε ηρεμία.</li>
              <li>Ελάχιστη αναγκαία πρόσβαση, ρόλοι, καταγραφή ενεργειών διαχειριστών.</li>
              <li>Τακτικά backup, σχέδιο αποκατάστασης και δοκιμές.</li>
              <li>Ενημερώσεις ασφαλείας, firewall/WAF, ανίχνευση ασυνήθιστης δραστηριότητας.</li>
              <li>Εκπαίδευση προσωπικού και υποχρέωση εμπιστευτικότητας.</li>
            </ul>
          </section>

          {/* 9α */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                9α. Data Breach &amp; Λογοδοσία
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Διαδικασία incident response: αξιολόγηση κινδύνου, ειδοποίηση ΑΠΔΠΧ/υποκειμένων όπου απαιτείται.</li>
              <li>Τήρηση RoPA (Αρχείο Δραστηριοτήτων) και DPIA όπου απαιτείται (π.χ. επεξεργασία υγείας).</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                10. Δικαιώματα Υποκειμένων (GDPR)
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">Έχετε δικαίωμα:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Πρόσβασης, διόρθωσης, διαγραφής, φορητότητας.</li>
              <li>Περιορισμού ή εναντίωσης στην επεξεργασία (όπου εφαρμόζεται).</li>
              <li>Ανάκλησης συγκατάθεσης χωρίς αναδρομική ισχύ.</li>
              <li>Υποβολής καταγγελίας στην ΑΠΔΠΧ (www.dpa.gr).</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              Για άσκηση δικαιωμάτων, επικοινωνήστε στο <a className="text-blue-600 dark:text-blue-300 underline" href="mailto:getfit.skg@gmail.com">getfit.skg@gmail.com</a>.
              Θα απαντήσουμε εντός ενός μήνα (με δυνατότητα παράτασης όπου προβλέπεται).
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Για αιτήματα DSR μπορεί να ζητηθεί πρόσθετη ταυτοποίηση. Η διαγραφή περιορίζεται όπου υπάρχει νομική υποχρέωση τήρησης (π.χ. τιμολόγηση).
            </p>
          </section>

          {/* 11 */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-pink-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                11. Επικοινωνία & Marketing
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Λειτουργικές ειδοποιήσεις (κρατήσεις, πληρωμές, ασφάλεια) αποστέλλονται ως μέρος της σύμβασης.</li>
              <li>Newsletters/προσφορές αποστέλλονται μόνο με ρητή συγκατάθεση. Μπορείτε να την ανακαλέσετε οποτεδήποτε.</li>
            </ul>
          </section>

          {/* 12 */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-cyan-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                12. Αυτοματοποιημένες Αποφάσεις / Προφίλ
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Δεν λαμβάνουμε αποφάσεις με έννομα αποτελέσματα αποκλειστικά μέσω αυτοματοποιημένης επεξεργασίας.
              Ενδέχεται να χρησιμοποιούμε βασική ανάλυση για προτάσεις προγραμμάτων χωρίς ουσιώδη επίδραση στα δικαιώματά σας.
            </p>
          </section>

          {/* 12α */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-amber-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                12α. Cookies &amp; Συγκατάθεση
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Απαραίτητα cookies λειτουργίας φορτώνονται χωρίς συγκατάθεση. Για analytics/marketing απαιτείται συγκατάθεση μέσω banner, με δυνατότητα ανάκλησης/ρύθμισης προτιμήσεων.
            </p>
          </section>

          {/* 13 */}
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                13. Όροι Χρήσης της Εφαρμογής
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Ο χρήστης είναι υπεύθυνος για την ακρίβεια στοιχείων και την εμπιστευτικότητα των διαπιστευτηρίων.</li>
              <li>Απαγορεύεται κακόβουλη χρήση, μη εξουσιοδοτημένη πρόσβαση, παραβίαση πνευματικών δικαιωμάτων ή κατάχρηση πόρων.</li>
              <li>Πληρωμές/συνδρομές: ισχύουν οι όροι τιμολόγησης και οι πολιτικές ακύρωσης/επιστροφών που εμφανίζονται κατά την αγορά.</li>
              <li>Η Εταιρεία επιδιώκει συνεχή διαθεσιμότητα, αλλά δεν ευθύνεται για διακοπές λόγω συντήρησης, ανωτέρας βίας ή τρίτων παρόχων.</li>
              <li>Η χρήση προϋποθέτει ηλικία ≥ 16 ετών ή γονική συναίνεση όπου απαιτείται.</li>
            </ul>
          </section>

          {/* 13α */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-rose-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                13α. Πληρωμές
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Δεν πραγματοποιούνται ηλεκτρονικές πληρωμές μέσα από την εφαρμογή. Οποιαδήποτε πληρωμή γίνεται εκτός πλατφόρμας (π.χ. στο γυμναστήριο) και δεν αποθηκεύουμε στοιχεία κάρτας ή άλλων μέσων πληρωμής.
            </p>
          </section>

          {/* 13β */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-lime-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                13β. Ειδικές Κατηγορίες Δεδομένων
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Στοιχεία υγείας συλλέγονται μόνο εφόσον τα παρέχετε οικειοθελώς και με ρητή συγκατάθεση, για σκοπούς ασφάλειας/καταλληλότητας προγραμμάτων.
            </p>
          </section>

          {/* 13γ */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                13γ. Ανηλίκοι
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Η υπηρεσία απευθύνεται σε άτομα ≥16 ετών. Για νεότερους απαιτείται γονική συναίνεση όπου το επιτρέπει ο νόμος.
            </p>
          </section>

          {/* 13δ */}
          <section>
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-gray-500 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                13δ. Accountability
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Διατηρούμε εσωτερικές πολιτικές πρόσβασης, περιοδική εκπαίδευση προσωπικού και αξιολόγηση τρίτων παρόχων. Πραγματοποιούμε περιοδικούς ελέγχους συμμόρφωσης και ενημερώνουμε τα έγγραφα όταν αλλάζουν οι ροές επεξεργασίας.
            </p>
          </section>

          {/* Πρόσθετες Διευκρινίσεις */}
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Πρόσθετες Διευκρινίσεις (νομικός έλεγχος)
              </h2>
            </div>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Υπεύθυνος Επεξεργασίας</h3>
                <p>Email επικοινωνίας/DPO: <a className="text-blue-600 dark:text-blue-300 underline" href="mailto:getfit.skg@gmail.com">getfit.skg@gmail.com</a><br />
                Διεύθυνση: Μαιάνδρου 43, Κορδελιό Εύοσμος</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Κατηγορίες Δεδομένων</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Λογαριασμός/Ταυτοποίηση: Email, κωδικός, όνομα, επώνυμο, τηλέφωνο (προαιρετικό), γλώσσα, referral code, ρόλος.</li>
                  <li>Προφίλ: Ημ. γέννησης, διεύθυνση, στοιχεία επείγουσας επικοινωνίας, φωτογραφία προφίλ (λήψη/ανέβασμα), κλείδωμα πεδίων (DOB/φωτο).</li>
                  <li>Συνδρομές/Οικονομικά (χωρίς e-payments): membership_requests, memberships, membership_package_durations, user_cash_transactions (μετρητά/POS εκτός app), installments, user_kettlebell_points.</li>
                  <li>Tracking app_visits: ημερομηνία επίσκεψης, (πιθανή) σελίδα, διάρκεια, user agent. Opt-out κατόπιν αιτήματος.</li>
                  <li>Φόρμα επικοινωνίας: όνομα, email, τηλέφωνο, θέμα/μήνυμα, checkbox συναίνεσης.</li>
                  <li>Cookies/τοπική αποθήκευση: sb-freegym-auth (Supabase tokens), freegym_user (cache), temp_password, sessionStorage flags. Καθαρίζονται σε logout/διαγραφή.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Τρίτοι / Υποδομές</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Supabase: auth, Postgres, RPC, storage (φωτογραφίες) — Εκτελών, απαιτείται DPA και επιβεβαίωση περιοχής φιλοξενίας/backup.</li>
                  <li>Google/Gmail API: αποστολή email φόρμας. Πιθανή διαβίβαση ΗΠΑ → SCCs.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Σκοποί &amp; Βάσεις</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Marketing emails (αν ενεργοποιηθούν): μόνο με ρητή συγκατάθεση.</li>
                  <li>Χρήση φωτογραφίας/κάμερας: μόνο για ταυτοποίηση/προφίλ.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Χρόνοι Τήρησης</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Λογαριασμός/προφίλ: μέχρι αίτημα διαγραφής (και όπως ορίζεται ανωτέρω).</li>
                  <li>Συναλλαγές/λογιστικά: σύμφωνα με ελληνικό δίκαιο (τουλ. 5–10 έτη).</li>
                  <li>App visits/tracking: 12 μήνες, εκτός αν ζητηθεί διαγραφή.</li>
                  <li>Φόρμα επικοινωνίας: 12 μήνες εκτός αν απαιτείται για εξυπηρέτηση.</li>
                  <li>Tokens/τοπικά στοιχεία: μέχρι logout ή διαγραφή λογαριασμού.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Διαγραφή Λογαριασμού &amp; Δεδομένων</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Πλήρης ροή διαγραφής από: memberships, membership_requests, user_profiles, contact_messages, app_visits, bookings, payments, personal_training και Supabase Auth.</li>
                  <li>Καθαρισμός localStorage/sessionStorage.</li>
                  <li>Λογιστικά στοιχεία τηρούνται όπου το επιβάλλει ο νόμος (αρχειοθέτηση).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Ασφάλεια</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>RLS (role-based policies) στη Supabase.</li>
                  <li>Περιορισμένη πρόσβαση σε admins/προσωπικό γυμναστηρίου.</li>
                  <li>Ασφαλής διαχείριση tokens.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Μεταφορές Εκτός ΕΕ</h3>
                <p>Supabase/Google ενδέχεται να μεταφέρουν δεδομένα εκτός ΕΕ (π.χ. ΗΠΑ). Εφαρμόζονται SCCs και κατάλληλα τεχνικά μέτρα.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tracking &amp; Opt-out</h3>
                <p>Η καταγραφή app_visits γίνεται για στατιστικά ποιότητας. Ο χρήστης ενημερώνεται και μπορεί να ζητήσει opt-out.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Όροι Χρήσης</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Αντικείμενο: κρατήσεις γυμναστηρίου, προβολή συνδρομών, διαχείριση λογαριασμού.</li>
                  <li>Υποχρεώσεις χρήστη: αληθή στοιχεία, όχι καταχρηστική/παράνομη χρήση, εμπιστευτικότητα κωδικών.</li>
                  <li>Περιορισμός ευθύνης: «ως έχει», όχι ευθύνη για δίκτυο/τρίτες υποδομές/κακή χρήση.</li>
                  <li>Ακυρώσεις/συνδρομές: σύμφωνα με εσωτερική πολιτική γυμναστηρίου.</li>
                  <li>Τροποποιήσεις όρων: ενημέρωση μέσω Εφαρμογής.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Επικοινωνία</h3>
                <p>Email επικοινωνίας/DPO: <a className="text-blue-600 dark:text-blue-300 underline" href="mailto:getfit.skg@gmail.com">getfit.skg@gmail.com</a><br />
                Διεύθυνση: Μαιάνδρου 43, Κορδελιό Εύοσμος</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Έναρξη Ισχύος</h3>
                <p>Η πολιτική ισχύει από την ημερομηνία δημοσίευσης και παραμένει ενεργή μέχρι νεότερης ενημέρωσης.</p>
              </div>
            </div>
          </section>

          {/* Συμπληρωματικοί Όροι FreeGym Booking */}
          <section>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-orange-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Συμπληρωματικοί Όροι για την Εφαρμογή “GetFit”
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Εισαγωγή &amp; Αποδοχή:</strong> Με την εγκατάσταση/χρήση της “GetFit” αποδέχεστε την παρούσα Πολιτική και τους Όρους.</li>
              <li><strong>Κρατήσεις χωρίς e-payments:</strong> Δεν διενεργούνται ηλεκτρονικές πληρωμές εντός εφαρμογής. Τυχόν συναλλαγές γίνονται εκτός εφαρμογής και μόνο για λογιστική καταγραφή.</li>
              <li><strong>DPA &amp; DPIA:</strong> Απαιτείται DPA με Supabase και Google (SCCs όπου χρειάζεται). DPIA όπου απαιτείται (φωτογραφία/health/tracking).</li>
              <li><strong>Διαδικασία άσκησης δικαιωμάτων (DSR):</strong> Αίτημα μέσω email, ταυτοποίηση (email validation), απάντηση εντός 30 ημερών, δυνατότητα παράτασης 2 μηνών για σύνθετα αιτήματα. Διαγραφή περιορίζεται όπου υπάρχουν νομικές υποχρεώσεις (π.χ. φορολογικά).</li>
              <li><strong>Opt-out tracking/marketing:</strong> Tracking app_visits μόνο για ποιότητα· χρήστης μπορεί να ζητήσει opt-out. Marketing emails (αν ενεργοποιηθούν) μόνο με ρητή συγκατάθεση και άμεσο opt-out.</li>
              <li><strong>Ασφάλεια (επιπλέον):</strong> RLS στη Supabase, διαχωρισμός ρόλων (Admin/Γραμματεία/Users), logging κρίσιμων ενεργειών (login, αλλαγή email/συνδρομής), ασφαλής διαχείριση tokens και καθαρισμός σε logout.</li>
              <li><strong>Όροι χρήσης (πρόσθετα):</strong> Απαγορεύεται αντιγραφή/αποσυμπίληση ή απόπειρα πρόσβασης σε ξένα δεδομένα. Λογαριασμοί μπορεί να δημιουργούνται από εξουσιοδοτημένη γραμματεία. Η Εφαρμογή παρέχεται «ως έχει»· δεν ευθυνόμαστε για διακοπές/καθυστερήσεις τρίτων (Supabase/Google) ή κακή χρήση.</li>
              <li><strong>Τρίτοι &amp; ευθύνη:</strong> Δεν ευθυνόμαστε για διακοπές υπηρεσιών Supabase/Google ή καθυστερήσεις ειδοποιήσεων email.</li>
              <li><strong>Δικαιοδοσία:</strong> Τυχόν διαφορές υπάγονται στα ελληνικά δικαστήρια.</li>
            </ul>
          </section>

          {/* 14 */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-gray-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                14. Αλλαγές Πολιτικής & Όρων
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              Μπορούμε να επικαιροποιούμε την παρούσα σελίδα. Σημαντικές αλλαγές κοινοποιούνται μέσω email ή εντός της εφαρμογής.
              Η συνέχιση χρήσης σημαίνει αποδοχή των ενημερωμένων όρων/πολιτικών.
            </p>
          </section>

          {/* 15 */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                15. Επικοινωνία
              </h2>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <p className="text-gray-800 dark:text-gray-200 mb-3">
                Για απορίες, αιτήματα GDPR ή άσκηση δικαιωμάτων:
              </p>
              <ul className="space-y-1 text-gray-800 dark:text-gray-200">
                <li><strong>Email:</strong> <a className="text-blue-700 dark:text-blue-300 underline" href="mailto:getfit.skg@gmail.com">getfit.skg@gmail.com</a></li>
                <li><strong>Διεύθυνση:</strong> Μαιάνδρου 43, Κορδελιό Εύοσμος</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} GetFit. Όλα τα δικαιώματα διατηρούνται.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;