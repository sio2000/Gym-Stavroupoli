import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// import { motion } from 'framer-motion'; // Replaced with CSS animations
import { 
  Users, 
  Copy, 
  Share2, 
  Award, 
  CheckCircle,
  Clock,
  Gift,
  Star,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  ShoppingBag
} from 'lucide-react';
// import { mockReferrals } from '@/data/mockData';
// import { formatDate, getReferralStatusName } from '@/utils';
import toast from 'react-hot-toast';
import { getUserReferralStats } from '@/services/referralService';

// Removed mock data - using real data from backend

const Referral: React.FC = () => {
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [points, setPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [referralStats, setReferralStats] = useState({
    total_points: 0,
    total_referrals: 0,
    recent_transactions: [] as any[]
  });

  // Get user's referrals from real data
  const userReferrals: any[] = referralStats.recent_transactions || [];
  const totalReferrals = referralStats.total_referrals || 0;
  
  // Mock data for user who was referred by someone
  const userReferredBy: any = null; // This would come from user profile data

  // Calculate pending rewards (for future use)
  // const pendingRewards = userReferrals
  //   .filter(ref => ref.status === 'pending')
  //   .reduce((sum, ref) => sum + ref.rewardCredits, 0);

  // Load referral points and stats
  useEffect(() => {
    const loadReferralData = async () => {
      if (!user?.id) return;
      
      try {
        // Use user's referral points from context
        setPoints(user?.referralPoints || 0);
        
        // Load referral stats from backend
        const stats = await getUserReferralStats(user.id);
        setReferralStats(stats);
      } catch (error) {
        console.error('Error loading referral data:', error);
        // Use fallback data from context
        setPoints(user?.referralPoints || 0);
      }
    };

    loadReferralData();
  }, [user?.id, user?.referralPoints]);

  // Animate points counter
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Handle copy referral code
  const handleCopyCode = async () => {
    try {
      const referralCode = user?.referralCode || '';
      if (!referralCode) {
        toast.error('Δεν υπάρχει κωδικός παραπομπής');
        return;
      }
      await navigator.clipboard.writeText(referralCode);
      toast.success('Ο κωδικός αντιγράφηκε επιτυχώς!');
    } catch (error) {
      toast.error('Σφάλμα κατά την αντιγραφή');
    }
  };

  // Handle share referral code
  const handleShareCode = async () => {
    const referralCode = user?.referralCode || '';
    if (!referralCode) {
      toast.error('Δεν υπάρχει κωδικός παραπομπής');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Get Fit - Κωδικός Παραπομπής',
          text: `Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${referralCode}`,
          url: `https://freegym.com/register?ref=${referralCode}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareModal(true);
    }
  };

  // Handle social media sharing
  const handleSocialShare = (platform: string) => {
    const referralCode = user?.referralCode || '';
    if (!referralCode) {
      toast.error('Δεν υπάρχει κωδικός παραπομπής');
      return;
    }
    
    const text = `Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${referralCode}`;
    const url = `https://freegym.com/register?ref=${referralCode}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'instagram':
        shareUrl = `https://www.instagram.com/`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
      toast.success(`Μοιρασμός στο ${platform} επιτυχής!`);
    }
  };

  // Handle reward redemption (commented out for now)
  // const handleRedeemReward = (rewardId: number, pointsCost: number) => {
  //   if (points >= pointsCost) {
  //     setPoints(prev => prev - pointsCost);
  //     setRedeemedItems(prev => [...prev, rewardId]);
  //     setIsAnimating(true);
  //     toast.success('Ανταμοιβή εξαργυρώθηκε επιτυχώς!');
  //   } else {
  //     toast.error('Δεν έχετε αρκετές πιστώσεις');
  //   }
  // };

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
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div 
        className="text-center sm:text-left animate-fadeInUp"
        style={{ opacity: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Σύστημα Παραπομπών
        </h1>
        <p className="text-gray-300 text-sm sm:text-base">
          Κερδίστε πιστώσεις παρακαλώντας φίλους να εγγραφούν
        </p>
        
        {/* Display current referral points */}
        <div className="mt-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-4 border border-green-600/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-300">Πόντοι Παραπομπής</span>
          </div>
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {points}
          </div>
          <p className="text-xs text-gray-400">
            Κερδίστε 10 πόντους για κάθε επιτυχή παραπομπή!
          </p>
        </div>
      </div>

      {/* Points Counter with Progress Bar */}
      <div 
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 rounded-2xl p-6 text-white shadow-2xl animate-fadeInUp"
        style={{ opacity: 0, animationDelay: '0.1s' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-dark-800/20 rounded-2xl backdrop-blur-sm">
              <Star className="h-8 w-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Στορ Πιστώσεις</h2>
              <p className="text-purple-100 text-sm">Κερδίστε 10 πιστώσεις για κάθε φίλο!</p>
            </div>
          </div>
          <div 
            className={`text-right ${isAnimating ? 'animate-bounce' : ''}`}
          >
            <div className="text-3xl sm:text-4xl font-bold text-yellow-300">
              {points}
            </div>
            <p className="text-purple-100 text-sm">πιστώσεις</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Πρόοδος προς επόμενη ανταμοιβή</span>
            <span>{points}/100</span>
          </div>
          <div className="w-full bg-dark-800/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min((points / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        style={{ opacity: 0 }}
      >
        <div 
          className="card text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale"
          style={{ opacity: 0, animationDelay: '0.2s' }}
        >
          <div className="p-3 bg-blue-100 rounded-lg inline-block mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {totalReferrals}
          </h3>
          <p className="text-gray-600 text-sm">Συνολικές παραπομπές</p>
        </div>
        
        <div 
          className="card text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale"
          style={{ opacity: 0, animationDelay: '0.3s' }}
        >
          <div className="p-3 bg-green-100 rounded-lg inline-block mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {userReferrals.filter(ref => ref.status === 'completed').length}
          </h3>
          <p className="text-gray-600 text-sm">Ολοκληρωμένες</p>
        </div>
        
        <div 
          className="card text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale"
          style={{ opacity: 0, animationDelay: '0.4s' }}
        >
          <div className="p-3 bg-yellow-100 rounded-lg inline-block mb-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {userReferrals.filter(ref => ref.status === 'pending').length}
          </h3>
          <p className="text-gray-600 text-sm">Σε εκκρεμότητα</p>
        </div>
        
        <div 
          className="card text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:scale-105 hover:-translate-y-1 transition-all duration-300 animate-fadeInScale"
          style={{ opacity: 0, animationDelay: '0.5s' }}
        >
          <div className="p-3 bg-purple-100 rounded-lg inline-block mb-3">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {points}
          </h3>
          <p className="text-gray-600 text-sm">Συνολικές πιστώσεις</p>
        </div>
      </div>

      {/* Your Referral Code */}
      <div 
        className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 animate-fadeInUp"
        style={{ opacity: 0, animationDelay: '0.6s' }}
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-primary-900 mb-2">
            Ο Κωδικός Παραπομπής σας
          </h2>
          <p className="text-primary-700">
            Μοιραστείτε αυτόν τον κωδικό με φίλους για να κερδίσετε πιστώσεις
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="bg-dark-800 px-6 py-3 rounded-lg border-2 border-primary-400 shadow-lg">
            <span className="text-2xl font-bold text-primary-400 font-mono">
              {user?.referralCode || 'Φόρτωση δεδομένων χρήστη… Αυτό μπορεί να διαρκέσει λίγα δευτερόλεπτα.'}
            </span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCopyCode}
              className="btn-secondary flex items-center hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <Copy className="h-4 w-4 mr-2" />
              Αντιγραφή
            </button>
            
            <button
              onClick={handleShareCode}
              className="btn-primary flex items-center hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Μοιρασμός
            </button>
          </div>
        </div>

        {/* Social Media Sharing */}
        <div className="mb-6">
          <h3 className="text-center text-primary-900 font-semibold mb-4">
            Μοιραστείτε στα Social Media
          </h3>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleSocialShare('facebook')}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Facebook className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => handleSocialShare('instagram')}
              className="p-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Instagram className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => handleSocialShare('twitter')}
              className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Twitter className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-primary-800">
          <div 
            className="flex items-start space-x-2 animate-slideInLeft"
            style={{ opacity: 0, animationDelay: '0.7s' }}
          >
            <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Μοιραστείτε τον κωδικό</p>
              <p>Με φίλους και συγγενείς</p>
            </div>
          </div>
          
          <div 
            className="flex items-start space-x-2 animate-fadeInUp"
            style={{ opacity: 0, animationDelay: '0.8s' }}
          >
            <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Εγγραφή με κωδικό</p>
              <p>Ο φίλος εγγράφεται χρησιμοποιώντας τον κωδικό</p>
            </div>
          </div>
          
          <div 
            className="flex items-start space-x-2 animate-slideInRight"
            style={{ opacity: 0, animationDelay: '0.9s' }}
          >
            <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center text-primary-800 text-xs font-bold mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Κερδίστε 10 πιστώσεις</p>
              <p>Και οι δύο λαμβάνετε πιστώσεις</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Catalog */}
      <div 
        className="card animate-fadeInUp"
        style={{ opacity: 0, animationDelay: '1.0s' }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Κατάλογος Ανταμοιβών</h2>
            <p className="text-gray-300">Εξαργυρώστε τις πιστώσεις σας</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Rewards will be implemented later */}
          <div className="text-center p-8 bg-dark-700 rounded-xl">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Ανταμοιβές</h3>
            <p className="text-gray-400 text-sm">Σύντομα διαθέσιμες!</p>
          </div>
          {/* Rewards will be implemented later - commented out to avoid TypeScript errors */}
          {/* {false && [].map((reward, index) => {
            const canRedeem = points >= reward.points && !redeemedItems.includes(reward.id);
            const isRedeemed = redeemedItems.includes(reward.id);
            
            return (
              <div
                key={reward.id}
                className={`relative bg-dark-800 rounded-xl p-4 sm:p-6 shadow-lg border-2 transition-all duration-300 animate-fadeInScale ${
                  isRedeemed 
                    ? 'border-dark-600 bg-dark-700 opacity-75' 
                    : canRedeem 
                      ? 'border-green-400 hover:border-green-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1' 
                      : 'border-dark-600 hover:border-dark-500 hover:scale-105 hover:-translate-y-1'
                }`}
                style={{ opacity: 0, animationDelay: `${1.1 + index * 0.1}s` }}
              >
                {isRedeemed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Εξαργυρώθηκε
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="text-4xl sm:text-5xl mb-3">{reward.image}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{reward.name}</h3>
                  <p className="text-sm text-gray-300 mb-3">{reward.description}</p>
                  <div className="inline-flex items-center px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-semibold">
                    <Star className="h-4 w-4 mr-1" />
                    {reward.points} πιστώσεις
                  </div>
                </div>
                
                <button
                  onClick={() => handleRedeemReward(reward.id, reward.points)}
                  disabled={!canRedeem}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    canRedeem
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isRedeemed ? 'Εξαργυρώθηκε' : canRedeem ? 'Εξαργύρωση Τώρα' : `Χρειάζεστε ${reward.points - points} ακόμα`}
                </button>
              </div>
            );
          })} */}
        </div>
      </div>

      {/* Referral History */}
      <div 
        className="card animate-fadeInUp"
        style={{ opacity: 0, animationDelay: '1.8s' }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Ιστορικό Παραπομπών</h2>
        
        <div className="space-y-3">
          {userReferrals.length > 0 ? (
            userReferrals.map((referral, index) => (
              <div 
                key={referral.id} 
                className="flex items-center justify-between p-4 bg-dark-700 rounded-lg animate-slideInLeft"
                style={{ opacity: 0, animationDelay: `${1.9 + index * 0.1}s` }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    referral.status === 'completed' ? 'bg-green-600/20' :
                    referral.status === 'pending' ? 'bg-yellow-600/20' :
                    'bg-dark-600'
                  }`}>
                    <Users className={`h-5 w-5 ${
                      referral.status === 'completed' ? 'text-green-400' :
                      referral.status === 'pending' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Παραπομπή #{index + 1}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString('el-GR')} • Ολοκληρώθηκε
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        +{referral.points_awarded || 10}
                      </div>
                      <p className="text-xs text-gray-500">πιστώσεις</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div 
              className="text-center py-8 text-gray-500 animate-fadeInUp"
              style={{ opacity: 0, animationDelay: '1.9s' }}
            >
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>Δεν έχετε παραπομπές ακόμα</p>
              <p className="text-sm">Μοιραστείτε τον κωδικό σας για να ξεκινήσετε</p>
            </div>
          )}
        </div>
      </div>

      {/* If user was referred by someone */}
      {userReferredBy && (
        <div 
          className="card bg-green-50 border-green-200 animate-fadeInUp"
          style={{ opacity: 0, animationDelay: '2.0s' }}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Κερδίσατε πιστώσεις από παραπομπή! 🎉
              </h3>
              <p className="text-green-700">
                Χρησιμοποιήσατε κωδικό παραπομπής κατά την εγγραφή και κερδίσατε {userReferredBy.rewardCredits} πιστώσεις.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Referral Rewards Info */}
      <div 
        className="card bg-yellow-50 border-yellow-200 animate-fadeInUp"
        style={{ opacity: 0, animationDelay: '2.1s' }}
      >
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          Πώς λειτουργούν οι ανταμοιβές
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-yellow-800">
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium">10 πιστώσεις για κάθε επιτυχημένη παραπομπή</p>
                <p>Όταν ο φίλος σας εγγραφεί και ενεργοποιήσει τη συνδρομή</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium">Άμεση πίστωση</p>
                <p>Οι πιστώσεις προστίθενται άμεσα στο λογαριασμό σας</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium">Απεριόριστες παραπομπές</p>
                <p>Δεν υπάρχει όριο στον αριθμό των παραπομπών</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-800 text-xs font-bold mt-0.5">
                ✓
              </div>
              <div>
                <p className="font-medium">Win-win για όλους</p>
                <p>Και οι δύο λαμβάνετε πιστώσεις</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeInUp">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fadeInScale">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Μοιρασμός Κωδικού</h3>
                
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">Κωδικός παραπομπής:</p>
                  <p className="font-mono text-lg font-bold text-primary-600">
                    {user?.referralCode}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Γίνετε μέλος στο Get Fit χρησιμοποιώντας τον κωδικό παραπομπής μου: ${user?.referralCode}`);
                      toast.success('Το μήνυμα αντιγράφηκε!');
                    }}
                    className="btn-secondary w-full hover:scale-105 active:scale-95 transition-transform duration-200"
                  >
                    Αντιγραφή μηνύματος
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://freegym.com/register?ref=${user?.referralCode}`);
                      toast.success('Το link αντιγράφηκε!');
                    }}
                    className="btn-primary w-full hover:scale-105 active:scale-95 transition-transform duration-200"
                  >
                    Αντιγραφή link
                  </button>
                </div>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 hover:text-gray-700 mt-4 text-sm hover:scale-105 transition-transform duration-200"
                >
                  Κλείσιμο
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Referral;