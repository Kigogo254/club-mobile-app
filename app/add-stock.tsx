import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  CaretDown,
  Plus,
  CheckCircle,
  XCircle,
  BeerBottle,
} from 'phosphor-react-native';
import { Drink } from '@/types/drink';
import { Picker } from '@react-native-picker/picker';

export default function AddStockScreen() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [additionAmount, setAdditionAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDrinks();
  }, []);

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('name');

      if (error) throw error;
      setDrinks(data || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
      Alert.alert('Error', 'Failed to load drinks');
    } finally {
      setLoading(false);
    }
  };

  const handleDrinkSelect = (drinkId: string) => {
    setSelectedDrinkId(drinkId);
    const drink = drinks.find(d => d.id.toString() === drinkId);
    if (drink) {
      setSelectedDrink(drink);
      setCurrentStock(drink.count_in_stock);
    }
    setShowPicker(false);
  };

  const validateInput = () => {
    if (!selectedDrink) {
      Alert.alert('Error', 'Please select a drink');
      return false;
    }

    if (!additionAmount || parseInt(additionAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid addition amount');
      return false;
    }

    return true;
  };

  const handleAddPress = () => {
    if (!validateInput()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    setShowConfirmModal(false);
    setUpdating(true);

    try {
      const addition = parseInt(additionAmount);
      const newStock = currentStock + addition;

      const { error } = await supabase
        .from('drinks')
        .update({ 
          count_in_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDrink!.id);

      if (error) throw error;

      Alert.alert(
        'Success',
        `Stock updated successfully!\n\nDrink: ${selectedDrink!.name}\nAddition: +${addition}\nNew Stock: ${newStock}`,
        [{ text: 'OK', onPress: () => {
          // Reset form
          setSelectedDrink(null);
          setSelectedDrinkId('');
          setCurrentStock(0);
          setAdditionAmount('');
          // Refresh drinks list
          fetchDrinks();
        }}]
      );

    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Failed to update stock. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelAdd = () => {
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Stock</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.iconContainer}>
            <BeerBottle size={48} color="#4A80F0" weight="duotone" />
          </View>
          
          <Text style={styles.formTitle}>Increase Drink Stock</Text>
          <Text style={styles.formSubtitle}>Select a drink and add to its current stock</Text>

          {/* Drink Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Drink <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity 
              style={styles.pickerButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={selectedDrink ? styles.pickerButtonText : styles.pickerPlaceholder}>
                {selectedDrink ? selectedDrink.name : 'Choose a drink...'} *
              </Text>
              <CaretDown size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Current Stock Display (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Stock</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {selectedDrink ? currentStock.toString() : '---'}
              </Text>
            </View>
          </View>

          {/* Addition Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount to Add <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of bottles"
              value={additionAmount}
              onChangeText={setAdditionAmount}
              keyboardType="numeric"
              editable={!updating}
            />
          </View>

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, updating && styles.addButtonDisabled]}
            onPress={handleAddPress}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Plus size={20} color="#fff" weight="bold" />
                <Text style={styles.addButtonText}>Add Stock</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
            {/* Info Paragraph */}
    <View style={styles.infoContainer}>
      <Text style={styles.infoText}>
        To add stock, first select a drink from the dropdown menu. The current stock 
        will be displayed automatically. Then enter the number of bottles you want to 
        add and tap "Add Stock". You'll be asked to confirm before the update is saved.
      </Text>
    </View>
      </ScrollView>

      {/* Custom Picker Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Drink</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <XCircle size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {drinks.map((drink) => (
                <TouchableOpacity
                  key={drink.id}
                  style={[
                    styles.modalItem,
                    selectedDrinkId === drink.id.toString() && styles.modalItemSelected
                  ]}
                  onPress={() => handleDrinkSelect(drink.id.toString())}
                >
                  <View style={styles.modalItemLeft}>
                    <BeerBottle size={20} color="#4A80F0" />
                    <Text style={styles.modalItemText}>{drink.name}</Text>
                  </View>
                  <Text style={styles.modalItemStock}>Stock: {drink.count_in_stock}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <BeerBottle size={48} color="#4A80F0" weight="duotone" />
            </View>
            
            <Text style={styles.confirmTitle}>Confirm Stock Addition</Text>
            
            <View style={styles.confirmDetails}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Drink:</Text>
                <Text style={styles.confirmValue}>{selectedDrink?.name}</Text>
              </View>
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Current Stock:</Text>
                <Text style={styles.confirmValue}>{currentStock}</Text>
              </View>
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Adding:</Text>
                <Text style={[styles.confirmValue, styles.confirmHighlight]}>
                  +{additionAmount}
                </Text>
              </View>
              
              <View style={styles.confirmDivider} />
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>New Stock:</Text>
                <Text style={[styles.confirmValue, styles.confirmTotal]}>
                  {currentStock + parseInt(additionAmount || '0')}
                </Text>
              </View>
            </View>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={handleCancelAdd}
              >
                <XCircle size={20} color="#FF4444" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmActionButton]}
                onPress={handleConfirmAdd}
              >
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.confirmActionText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  infoContainer: {
  backgroundColor: '#E8F0FE',
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  marginTop: 30,
  borderLeftWidth: 4,
  borderLeftColor: '#4A80F0',
},
infoText: {
  fontSize: 14,
  lineHeight: 20,
  color: '#333',
  textAlign: 'left',
},
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalList: {
    padding: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#E8F0FE',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemStock: {
    fontSize: 14,
    color: '#666',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  confirmDetails: {
    width: '100%',
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  confirmLabel: {
    fontSize: 16,
    color: '#666',
  },
  confirmValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  confirmHighlight: {
    color: '#4A80F0',
    fontWeight: 'bold',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  confirmTotal: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmActionButton: {
    backgroundColor: '#4CAF50',
  },
  confirmActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});