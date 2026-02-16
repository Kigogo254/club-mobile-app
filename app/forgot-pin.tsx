import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Key, 
  ArrowLeft, 
  IdentificationCard, 
  Lock, 
  CheckCircle,
  ArrowCounterClockwise 
} from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

export default function ForgotPinScreen() {
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'verify' | 'success'>('verify');

  const validateInputs = () => {
    if (!identificationNumber) {
      Alert.alert('Error', 'Please enter your identification number');
      return false;
    }

    if (!newPin) {
      Alert.alert('Error', 'Please enter new PIN');
      return false;
    }

    if (!confirmPin) {
      Alert.alert('Error', 'Please confirm your new PIN');
      return false;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PIN and confirm PIN do not match');
      return false;
    }

    if (newPin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return false;
    }

    if (newPin.length > 6) {
      Alert.alert('Error', 'PIN must not exceed 6 digits');
      return false;
    }

    return true;
  };

  const handleResetPin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // First verify the identification number
      const { data: adminData, error: adminError } = await supabase
        .from('admin-ids')
        .select('identification_number')
        .eq('id', 1)
        .single();

      if (adminError) {
        console.error('Admin ID fetch error:', adminError);
        Alert.alert('Error', 'Wrong identification number, Contact Surport!');
        return;
      }

      // Check if identification number matches
      if (adminData.identification_number !== identificationNumber) {
        Alert.alert('Error', 'Invalid identification number');
        return;
      }

      // If identification number is valid, update the PIN
      const { error: updateError } = await supabase
        .from('entry-pin')
        .update({ pin: newPin })
        .eq('id', 1);

      if (updateError) {
        console.error('PIN update error:', updateError);
        Alert.alert('Error', 'Failed to update PIN');
        return;
      }

      // Show success state
      setStep('success');
      
      // Clear form
      setIdentificationNumber('');
      setNewPin('');
      setConfirmPin('');

    } catch (error) {
      console.error('Reset error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleTryAgain = () => {
    setStep('verify');
    setIdentificationNumber('');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/admin-bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

         <View style={styles.content}>
  {step === 'verify' ? (
    <>
      <View style={styles.iconContainer}>
        <Key size={64} weight="duotone" color="#FFFFFF" />
      </View>
      
      <Text style={styles.title}>Reset PIN</Text>
      <Text style={styles.subtitle}>
        Enter your identification number and choose a new PIN
      </Text>
      
      <View style={styles.formContainer}>
        {/* Identification Number Input with Label */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Your ID</Text>
          <View style={styles.inputContainer}>
            <IdentificationCard 
              size={20} 
              color="#4A80F0" 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your identification number"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={identificationNumber}
              onChangeText={setIdentificationNumber}
              editable={!loading}
              keyboardType="numeric"
              maxLength={20}
            />
          </View>
        </View>

        {/* New PIN Input with Label */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>New PIN</Text>
          <View style={styles.inputContainer}>
            <Lock 
              size={20} 
              color="#4A80F0" 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Enter new PIN (4-6 digits)"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              secureTextEntry
              keyboardType="numeric"
              value={newPin}
              onChangeText={setNewPin}
              editable={!loading}
              maxLength={6}
            />
          </View>
        </View>

        {/* Confirm PIN Input with Label */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Confirm New PIN</Text>
          <View style={styles.inputContainer}>
            <CheckCircle 
              size={20} 
              color="#4A80F0" 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your new PIN"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              secureTextEntry
              keyboardType="numeric"
              value={confirmPin}
              onChangeText={setConfirmPin}
              editable={!loading}
              maxLength={6}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={styles.buttonText}>Reset PIN</Text>
              <ArrowCounterClockwise size={20} weight="bold" color="#1a1a1a" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToLoginLink}
          onPress={handleBackToLogin}
        >
          <Text style={styles.backToLoginLinkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </>
  ) : (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <CheckCircle size={48} weight="duotone" color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>PIN Reset Successful!</Text>
      <Text style={styles.successMessage}>
        Your PIN has been successfully updated.{'\n'}
        You can now log in with your new PIN.
      </Text>
      <View style={styles.successButtons}>
        <TouchableOpacity
          style={styles.successButton}
          onPress={handleBackToLogin}
        >
          <Text style={styles.successButtonText}>Go to Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleTryAgain}
        >
          <Text style={styles.secondaryButtonText}>Reset Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: height - 100,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputIcon: {
    marginLeft: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginLink: {
    padding: 20,
    alignItems: 'center',
  },
  backToLoginLinkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  successButtons: {
    width: '100%',
    gap: 10,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  




});