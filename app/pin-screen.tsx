import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Keyboard,
  Dimensions,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, ArrowRight, Key, WarningCircle } from 'phosphor-react-native';

const { width, height } = Dimensions.get('window');

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pinInputRef = useRef<TextInput>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const verifyPin = async () => {
    // Clear previous error
    setErrorMessage('');
    
    if (!pin) {
      setErrorMessage('Please enter PIN');
      shakeError();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entry-pin')
        .select('pin')
        .eq('id', 1)
        .single();

      if (error) {
        // Handle specific Supabase errors
        if (error.code === 'PGRST116') {
          setErrorMessage('Wrong Pin Boss!. Try Again.');
        } else {
          setErrorMessage('Network error. Please try again.');
        }
        console.error('Supabase error:', error);
        shakeError();
        return;
      }

      if (data && data.pin === pin) {
        // Successful login
        setPin('');
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Invalid PIN. Please try again.');
        setPin('');
        shakeError();
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection.');
      console.error('Network error:', error);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    router.push('/forgot-pin');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/admin-bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Optional overlay to darken/lighten the background */}
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
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { translateX: shakeAnim }
                  ]
                }
              ]}
            >
              <View style={styles.iconContainer}>
                <Lock size={64} weight="duotone" color="#FFFFFF" />
              </View>
              
              <Text style={styles.title}>Admin Access</Text>
              <Text style={styles.subtitle}>Enter your PIN to continue "</Text>
              
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <WarningCircle size={20} color="#FF6B6B" weight="bold" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <TextInput
                  ref={pinInputRef}
                  style={styles.input}
                  placeholder="Enter PIN"
                  placeholderTextColor="rgba(53, 11, 204, 0.5)"
                  secureTextEntry
                  keyboardType="numeric"
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  maxLength={6}
                  editable={!loading}
                  autoFocus={true}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={verifyPin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify PIN</Text>
                    <ArrowRight size={20} weight="bold" color="#1a1a1a" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPin}
                activeOpacity={0.7}
              >
                <Key size={26} color="rgba(250, 249, 249, 0.8)" />
                <Text style={styles.forgotButtonText}>Forgot PIN? or Change PIN</Text>
                
              </TouchableOpacity>
            </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
    width: '100%',
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 18,
    fontSize: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    color: '#1a1a1a',
    fontWeight: '600',
    letterSpacing: 4,
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
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    gap: 8,
  },
  forgotButtonText: {
    color: 'rgba(253, 251, 251, 0.9)',
    fontSize: 20,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});