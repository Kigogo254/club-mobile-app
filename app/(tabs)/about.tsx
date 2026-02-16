import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Phone,
  Mailbox,
  User,
  Users,
  Globe,
  Code,
  DeviceMobile,
  Briefcase,
  GithubLogo,
  LinkedinLogo,
  PhoneCall,
  PintGlass,
} from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';

interface Worker {
  id: number;
  name: string;
  phone: string;
  position: string;
  created_at?: string;
}

export default function AboutScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      Alert.alert('Error', 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const makeCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <PintGlass size={24} color="#4A80F0" weight="duotone" />
            <Text style={styles.locationTitle}>Palms Club</Text>
          </View>
          <Text style={styles.locationAddress}>
            Location{'\n'}
            Mtongwe, Bububu{'\n'}
            Opposite Kona mbaya
          </Text>
          <View style={styles.locationActions}>
            <TouchableOpacity 
              style={styles.locationAction}
              onPress={() => openLink('https://maps.google.com/?q=Westlands,Nairobi')}
            >
              <MapPin size={16} color="#4A80F0" />
              <Text style={styles.locationActionText}>Click for Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manager Card - Huge at the top with local image */}
        <View style={styles.managerCard}>
          <View style={styles.managerImageContainer}>
            <Image 
              source={require('@/assets/images/manager.png')}
              style={styles.managerImage}
              defaultSource={require('@/assets/images/manager.png')}
            />
          </View>
          <View style={styles.managerInfo}>
            <Text style={styles.managerName}>David Moseti</Text>
            <Text style={styles.managerRole}>General Manager</Text>
            <View style={styles.managerContact}>
              <View style={styles.contactItem}>
                <Phone size={16} color="#4A80F0" />
                <Text style={styles.contactText}>+254 722 123 456</Text>
              </View>
              <View style={styles.contactItem}>
                <Mailbox size={16} color="#4A80F0" />
                <Text style={styles.contactText}>kigogoian@gmail.com</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Workers Section */}
        <View style={styles.workersSection}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#4A80F0" />
            <Text style={styles.sectionTitle}>Our Team</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A80F0" />
            </View>
          ) : (
            <View style={styles.workersGrid}>
              {workers.map((worker) => (
                <View key={worker.id} style={styles.workerCard}>
                  <View style={styles.workerIconContainer}>
                    <User size={40} color="#4A80F0" weight="duotone" />
                  </View>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerPosition}>{worker.position}</Text>
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => makeCall(worker.phone)}
                  >
                    <PhoneCall size={14} color="#fff" weight="bold" />
                    <Text style={styles.callButtonText}>Call Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Developer Info - Hardcoded */}
        <View style={styles.developerSection}>
          <View style={styles.sectionHeader}>
            <Code size={20} color="#4A80F0" />
            <Text style={styles.sectionTitle}>This app was Developed By</Text>
          </View>

          <View style={styles.developerCard}>
            <View style={styles.developerHeader}>
              <Image 
                source={require('@/assets/images/developer.png')}
                style={styles.developerImage}
                defaultSource={require('@/assets/images/developer.png')}
              />
              <View style={styles.developerTitle}>
                <Text style={styles.developerName}>Ian Lumbasi</Text>
                <Text style={styles.developerTag}>Full Stack & Android Developer</Text>
              </View>
            </View>

            <View style={styles.developerBio}>
              <Text style={styles.bioText}>
                I build complete systems for businesses of all sizes. From mobile apps to web platforms, 
                I create solutions that streamline operations and boost productivity.
              </Text>
            </View>

            <View style={styles.developerContact}>
              <TouchableOpacity 
                style={styles.developerContactItem}
                onPress={() => makeCall('+254793406784')}
              >
                <Phone size={16} color="#4A80F0" />
                <Text style={styles.developerContactText}>+254 793 406 784</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.developerCallButton}>
              <TouchableOpacity 
                style={styles.callDeveloperButton}
                onPress={() => makeCall('+254793406784')}
              >
                <PhoneCall size={18} color="#fff" weight="bold" />
                <Text style={styles.callDeveloperButtonText}>Call Developer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.developerLinks}>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => openLink('https://developer-kigogo.web.app')}
              >
                <Globe size={18} color="#fff" />
                <Text style={styles.linkButtonText}>Portfolio</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.linkButton, styles.githubButton]}
                onPress={() => openLink('https://github.com/Kigogo254')}
              >
                <GithubLogo size={18} color="#fff" />
                <Text style={styles.linkButtonText}>GitHub</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.linkButton, styles.linkedinButton]}
                onPress={() => openLink('https://www.linkedin.com/in/kigogo-ian-15754a3b1/')}
              >
                <LinkedinLogo size={18} color="#fff" />
                <Text style={styles.linkButtonText}>LinkedIn</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.servicesList}>
              <Text style={styles.servicesTitle}>What I Build:</Text>
              <View style={styles.servicesGrid}>
                <View style={styles.serviceTag}>
                  <DeviceMobile size={14} color="#4A80F0" />
                  <Text style={styles.serviceText}>Mobile Apps</Text>
                </View>
                <View style={styles.serviceTag}>
                  <Code size={14} color="#4A80F0" />
                  <Text style={styles.serviceText}>Website Systems</Text>
                </View>
                <View style={styles.serviceTag}>
                  <Briefcase size={14} color="#4A80F0" />
                  <Text style={styles.serviceText}>Business Systems</Text>
                </View>

              </View>
            </View>
          </View>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Club Management System v1.0.0</Text>
          <Text style={styles.footerCopyright}>© 2026 The Palmas Leissure</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  locationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  locationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationActionText: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '500',
  },
  managerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  managerImageContainer: {
    marginRight: 20,
  },
  managerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4A80F0',
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  managerRole: {
    fontSize: 14,
    color: '#4A80F0',
    fontWeight: '500',
    marginBottom: 12,
  },
  managerContact: {
    gap: 6,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
  },
  managerNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  workersSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  workersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  workerPosition: {
    fontSize: 9,
    color: '#4A80F0',
    marginBottom: 8,
    textAlign: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    width: '100%',
  },
  callButtonText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '500',
  },
  developerSection: {
    marginBottom: 20,
  },
  developerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  developerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  developerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#4A80F0',
  },
  developerTitle: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  developerTag: {
    fontSize: 12,
    color: '#4A80F0',
    fontWeight: '500',
  },
  developerBio: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  developerContact: {
    marginBottom: 12,
  },
  developerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  developerContactText: {
    fontSize: 13,
    color: '#666',
  },
  developerCallButton: {
    marginBottom: 16,
  },
  callDeveloperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  callDeveloperButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  developerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A80F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  githubButton: {
    backgroundColor: '#333',
  },
  linkedinButton: {
    backgroundColor: '#0077B5',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  servicesList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  serviceText: {
    fontSize: 11,
    color: '#4A80F0',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  footerCopyright: {
    fontSize: 10,
    color: '#ccc',
  },
});