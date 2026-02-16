import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  BeerBottle,
  CurrencyDollar,
  Cube,
  Coins,
  CheckCircle,
  WarningCircle,
  Package,
} from 'phosphor-react-native';
import { Picker } from '@react-native-picker/picker';

export default function NewDrinkScreen() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    buyingPrice: '',
    currentStock: '',
    maxStock: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameError, setNameError] = useState('');

  // Calculate profit preview
  const calculateProfit = () => {
    const sellingPrice = parseFloat(formData.price) || 0;
    const buyingPrice = parseFloat(formData.buyingPrice) || 0;
    return sellingPrice - buyingPrice;
  };

  const profitPerBottle = calculateProfit();
  const isValidProfit = profitPerBottle > 0;

  // Calculate total values
  const calculateTotalValues = () => {
    const currentStockNum = parseInt(formData.currentStock) || 0;
    const buyingPriceNum = parseFloat(formData.buyingPrice) || 0;
    const sellingPriceNum = parseFloat(formData.price) || 0;
    
    const totalCost = currentStockNum * buyingPriceNum;
    const totalValue = currentStockNum * sellingPriceNum;
    const totalProfit = totalValue - totalCost;
    
    return { totalCost, totalValue, totalProfit };
  };

  const totals = calculateTotalValues();

  // Check if current stock exceeds max stock
  const isStockValid = () => {
    if (!formData.currentStock || !formData.maxStock) return true;
    return parseInt(formData.currentStock) <= parseInt(formData.maxStock);
  };

  // Check if drink name already exists
  const checkDrinkName = async (name: string) => {
    if (!name.trim()) {
      setNameAvailable(null);
      setNameError('');
      return;
    }

    setCheckingName(true);
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('name')
        .ilike('name', name.trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setNameAvailable(false);
        setNameError('This drink name already exists');
      } else {
        setNameAvailable(true);
        setNameError('');
      }
    } catch (error) {
      console.error('Error checking drink name:', error);
      setNameAvailable(null);
    } finally {
      setCheckingName(false);
    }
  };

  // Handle name input with debounce
  const handleNameChange = (text: string) => {
    setFormData({ ...formData, name: text });
    checkDrinkName(text);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a drink name');
      return false;
    }

    if (!nameAvailable) {
      Alert.alert('Error', nameError || 'Drink name is not available');
      return false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid selling price');
      return false;
    }

    if (!formData.buyingPrice || parseFloat(formData.buyingPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid buying price');
      return false;
    }

    if (parseFloat(formData.buyingPrice) >= parseFloat(formData.price)) {
      Alert.alert(
        'Error', 
        'Buying price must be less than selling price to make a profit'
      );
      return false;
    }

    if (!formData.currentStock || parseInt(formData.currentStock) < 0) {
      Alert.alert('Error', 'Please enter a valid current stock quantity');
      return false;
    }

    if (!formData.maxStock) {
      Alert.alert('Error', 'Please select maximum stock capacity');
      return false;
    }

    if (!isStockValid()) {
      Alert.alert('Error', 'Current stock cannot exceed maximum stock capacity');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('drinks')
        .insert([
          {
            name: formData.name.trim(),
            price: parseFloat(formData.price),
            "buying-price": parseFloat(formData.buyingPrice),
            count_in_stock: parseInt(formData.currentStock),
            max_stock: parseInt(formData.maxStock),
            bottle_icon: 'bottle',
          },
        ]);

      if (error) throw error;

      Alert.alert(
        'Success',
        `${formData.name} has been added successfully with ${formData.currentStock} bottles in stock!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding drink:', error);
      Alert.alert('Error', 'Failed to add drink. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Ksh. ${amount.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Drink</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.iconContainer}>
            <BeerBottle size={48} color="#4A80F0" weight="duotone" />
          </View>
          
          <Text style={styles.formTitle}>New Drink Details</Text>
          <Text style={styles.formSubtitle}>Enter the information below to add a new drink</Text>

          {/* Drink Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Drink Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.nameInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  nameAvailable === false && styles.inputError,
                  nameAvailable === true && styles.inputSuccess,
                ]}
                placeholder="e.g., Chrome, KC , etc."
                value={formData.name}
                onChangeText={handleNameChange}
                editable={!loading}
              />
              {checkingName && (
                <ActivityIndicator size="small" color="#4A80F0" style={styles.nameIndicator} />
              )}
              {!checkingName && nameAvailable === true && (
                <CheckCircle size={20} color="#4CAF50" style={styles.nameIndicator} weight="bold" />
              )}
              {!checkingName && nameAvailable === false && (
                <WarningCircle size={20} color="#FF4444" style={styles.nameIndicator} weight="bold" />
              )}
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
          </View>

          {/* Selling Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Selling Price (Ksh.) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <CurrencyDollar size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Buying Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Buying Price (Ksh.) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <Coins size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                value={formData.buyingPrice}
                onChangeText={(text) => setFormData({ ...formData, buyingPrice: text })}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Profit Preview */}
          {formData.price && formData.buyingPrice && (
            <View style={[styles.profitPreview, !isValidProfit && styles.profitPreviewWarning]}>
              <View style={styles.profitPreviewHeader}>
                <Coins size={20} color={isValidProfit ? "#4CAF50" : "#FF4444"} weight="duotone" />
                <Text style={[styles.profitPreviewTitle, !isValidProfit && styles.profitPreviewTitleWarning]}>
                  Profit Preview
                </Text>
              </View>
              <View style={styles.profitPreviewRow}>
                <Text style={styles.profitPreviewLabel}>Profit per bottle:</Text>
                <Text style={[
                  styles.profitPreviewValue,
                  { color: isValidProfit ? '#4CAF50' : '#FF4444' }
                ]}>
                  {formatCurrency(profitPerBottle)}
                </Text>
              </View>
              {!isValidProfit && (
                <Text style={styles.profitPreviewWarningText}>
                  ⚠️ Buying price must be less than selling price
                </Text>
              )}
            </View>
          )}

          {/* Current Stock Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Current Stock (bottles) <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.priceInputContainer}>
              <Package size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.priceInput,
                  !isStockValid() && styles.inputError,
                ]}
                placeholder="0"
                value={formData.currentStock}
                onChangeText={(text) => setFormData({ ...formData, currentStock: text })}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            {!isStockValid() && formData.maxStock && (
              <Text style={styles.errorText}>
                Current stock cannot exceed maximum stock ({formData.maxStock})
              </Text>
            )}
          </View>

          {/* Max Stock Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Maximum Stock Capacity <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Cube size={20} color="#666" style={styles.pickerIcon} />
              <Picker
                selectedValue={formData.maxStock}
                onValueChange={(value) => setFormData({ ...formData, maxStock: value })}
                style={styles.picker}
                enabled={!loading}
              >
                <Picker.Item label="Select capacity..." value="" />
                <Picker.Item label="50 bottles" value="50" />
                <Picker.Item label="100 bottles" value="100" />
                <Picker.Item label="150 bottles" value="150" />
                <Picker.Item label="200 bottles" value="200" />
                <Picker.Item label="300 bottles" value="300" />
                <Picker.Item label="500 bottles" value="500" />
              </Picker>
            </View>
          </View>

          {/* Total Value Preview */}
          {formData.currentStock && formData.price && formData.buyingPrice && isStockValid() && (
            <View style={styles.totalPreview}>
              <Text style={styles.totalPreviewTitle}>Initial Stock Value</Text>
              <View style={styles.totalPreviewRow}>
                <Text style={styles.totalPreviewLabel}>Total Cost:</Text>
                <Text style={styles.totalPreviewValue}>{formatCurrency(totals.totalCost)}</Text>
              </View>
              <View style={styles.totalPreviewRow}>
                <Text style={styles.totalPreviewLabel}>Potential Sales:</Text>
                <Text style={styles.totalPreviewValue}>{formatCurrency(totals.totalValue)}</Text>
              </View>
              <View style={styles.totalPreviewDivider} />
              <View style={styles.totalPreviewRow}>
                <Text style={styles.totalPreviewLabel}>Potential Profit:</Text>
                <Text style={[
                  styles.totalPreviewValue,
                  { color: totals.totalProfit >= 0 ? '#4CAF50' : '#FF4444', fontWeight: 'bold' }
                ]}>
                  {formatCurrency(totals.totalProfit)}
                </Text>
              </View>
            </View>
          )}

          {/* Info Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              <Text style={styles.noteEmphasis}>Note:</Text> You're adding {formData.currentStock || '0'} bottles 
              as initial stock. Make sure current stock doesn't exceed maximum capacity.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || !isStockValid()) && styles.submitButtonDisabled,
              !isValidProfit && formData.price && formData.buyingPrice && styles.submitButtonWarning,
            ]}
            onPress={handleSubmit}
            disabled={loading || !isValidProfit || !isStockValid()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <BeerBottle size={20} color="#fff" weight="bold" />
                <Text style={styles.submitButtonText}>Add Drink</Text>
              </>
            )}
          </TouchableOpacity>
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  nameIndicator: {
    position: 'absolute',
    right: 12,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
  },
  inputIcon: {
    marginLeft: 14,
  },
  priceInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  profitPreview: {
    backgroundColor: '#E8F7E8',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  profitPreviewWarning: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4444',
  },
  profitPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  profitPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  profitPreviewTitleWarning: {
    color: '#FF4444',
  },
  profitPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitPreviewLabel: {
    fontSize: 14,
    color: '#666',
  },
  profitPreviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitPreviewWarningText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  totalPreview: {
    backgroundColor: '#E8F0FE',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4A80F0',
  },
  totalPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A80F0',
    marginBottom: 12,
  },
  totalPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalPreviewLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalPreviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalPreviewDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pickerIcon: {
    marginLeft: 14,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  noteContainer: {
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: '#4A80F0',
    lineHeight: 18,
  },
  noteEmphasis: {
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A80F0',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonWarning: {
    backgroundColor: '#FF4444',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});