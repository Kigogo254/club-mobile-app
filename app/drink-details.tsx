import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import {
  ArrowLeft,
  Wine,
  Cube,
  CurrencyDollar,
  Trash,
  FloppyDisk,
  Plus,
  PencilSimple,
  CheckCircle,
  Info,
  Coins,
} from 'phosphor-react-native';
import { Drink } from '@/types/drink';

export default function DrinkDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [drink, setDrink] = useState<Drink | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedDrink, setEditedDrink] = useState<Partial<Drink>>({
    name: '',
    price: 0,
    "buying-price": 0,
    count_in_stock: 0,
    max_stock: 0,
  });

  useEffect(() => {
    fetchDrinkDetails();
  }, [id]);

  const fetchDrinkDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDrink(data);
      setEditedDrink({
        name: data.name || '',
        price: data.price || 0,
        "buying-price": data["buying-price"] || 0,
        count_in_stock: data.count_in_stock || 0,
        max_stock: data.max_stock || 0,
      });
    } catch (error) {
      console.error('Error fetching drink:', error);
      Alert.alert('Error', 'Failed to load drink details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!drink || !editedDrink) return;

    // Validate that current stock doesn't exceed max stock
    const currentStock = editedDrink.count_in_stock || 0;
    const maxStock = editedDrink.max_stock || 0;
    
    if (currentStock > maxStock) {
      Alert.alert('Error', 'Current stock cannot exceed maximum stock');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('drinks')
        .update({
          name: editedDrink.name || drink.name,
          price: editedDrink.price || drink.price,
          "buying-price": editedDrink["buying-price"] || drink["buying-price"],
          count_in_stock: currentStock,
          max_stock: maxStock,
        })
        .eq('id', drink.id);

      if (error) throw error;

      setDrink({ ...drink, ...editedDrink });
      setEditing(false);
      Alert.alert('Success', 'Drink updated successfully');
    } catch (error) {
      console.error('Error updating drink:', error);
      Alert.alert('Error', 'Failed to update drink');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Drink',
      `Are you sure you want to delete ${drink?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('drinks')
                .delete()
                .eq('id', drink?.id);

              if (error) throw error;

              Alert.alert('Success', 'Drink deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting drink:', error);
              Alert.alert('Error', 'Failed to delete drink');
            }
          },
        },
      ]
    );
  };

  const getBorderColor = (count: number) => {
    if (count < 10) return '#FF4444';
    if (count <= 50) return '#333333';
    return '#4CAF50';
  };

  const getProgressColor = (count: number) => {
    if (count < 10) return '#FF4444';
    if (count <= 50) return '#333333';
    return '#4CAF50';
  };

  const formatCurrency = (amount: number) => {
    return `Ksh. ${amount.toLocaleString('en-KE')}`;
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

  if (!drink) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Drink Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>The drink you're looking for doesn't exist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercentage = (drink.count_in_stock / drink.max_stock) * 100;
  const totalSellingValue = drink.count_in_stock * drink.price;
  const totalBuyingValue = drink.count_in_stock * drink["buying-price"];
  const profitPerBottle = drink.price - drink["buying-price"];
  const totalProfit = totalSellingValue - totalBuyingValue;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {editing ? 'Edit Drink' : drink.name}
        </Text>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editButton}>
          {editing ? (
            <CheckCircle size={24} color="#4CAF50" />
          ) : (
            <PencilSimple size={24} color="#4A80F0" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.previewCard, { borderColor: getBorderColor(drink.count_in_stock) }]}>
          <View style={styles.iconContainer}>
            <Wine size={48} color="#4A80F0" weight="duotone" />
          </View>
          <Text style={styles.previewName}>{drink.name}</Text>
        </View>

        {editing ? (
          // Edit Mode
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Drink Name</Text>
              <TextInput
                style={styles.input}
                value={editedDrink.name || ''}
                onChangeText={(text) => setEditedDrink({ ...editedDrink, name: text })}
                placeholder="Enter drink name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Selling Price (Ksh.)</Text>
              <TextInput
                style={styles.input}
                value={editedDrink.price?.toString() || '0'}
                onChangeText={(text) => setEditedDrink({ ...editedDrink, price: parseFloat(text) || 0 })}
                placeholder="Enter selling price"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Buying Price (Ksh.)</Text>
              <TextInput
                style={styles.input}
                value={editedDrink["buying-price"]?.toString() || '0'}
                onChangeText={(text) => setEditedDrink({ ...editedDrink, "buying-price": parseFloat(text) || 0 })}
                placeholder="Enter buying price"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Current Stock Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Stock (bottles)</Text>
              <TextInput
                style={styles.input}
                value={editedDrink.count_in_stock?.toString() || '0'}
                onChangeText={(text) => setEditedDrink({ ...editedDrink, count_in_stock: parseInt(text) || 0 })}
                placeholder="Enter current stock"
                keyboardType="numeric"
              />
              {editedDrink.count_in_stock !== undefined && 
               editedDrink.max_stock !== undefined && 
               editedDrink.count_in_stock > editedDrink.max_stock && (
                <Text style={styles.warningText}>
                  ⚠️ Current stock exceeds maximum stock ({editedDrink.max_stock})
                </Text>
              )}
            </View>

            {/* Maximum Stock Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Stock Capacity</Text>
              <View style={styles.pickerContainer}>
                <Cube size={20} color="#666" style={styles.pickerIcon} />
                <Picker
                  selectedValue={editedDrink.max_stock?.toString() || ''}
                  onValueChange={(value) => setEditedDrink({ ...editedDrink, max_stock: parseInt(value) || 0 })}
                  style={styles.picker}
                  enabled={!saving}
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

            {/* Profit Preview During Edit */}
            {editedDrink.price && editedDrink["buying-price"] && (
              <View style={[
                styles.editProfitPreview,
                (editedDrink.price - editedDrink["buying-price"]) <= 0 && styles.editProfitPreviewWarning
              ]}>
                <View style={styles.editProfitRow}>
                  <Text style={styles.editProfitLabel}>Profit per bottle:</Text>
                  <Text style={[
                    styles.editProfitValue,
                    { color: (editedDrink.price - editedDrink["buying-price"]) > 0 ? '#4CAF50' : '#FF4444' }
                  ]}>
                    {formatCurrency(editedDrink.price - editedDrink["buying-price"])}
                  </Text>
                </View>
                {(editedDrink.price - editedDrink["buying-price"]) <= 0 && (
                  <Text style={styles.editProfitWarning}>
                    ⚠️ Buying price should be less than selling price
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton, 
                saving && styles.saveButtonDisabled,
                (editedDrink.count_in_stock || 0) > (editedDrink.max_stock || 0) && styles.saveButtonDisabled
              ]}
              onPress={handleSaveChanges}
              disabled={saving || (editedDrink.count_in_stock || 0) > (editedDrink.max_stock || 0)}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FloppyDisk size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // View Mode - Simplified Info Display
          <>
            {/* Stock Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Cube size={20} color="#4A80F0" />
                <Text style={styles.infoHeaderText}>Stock Information</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Stock:</Text>
                <Text style={styles.infoValue}>{drink.count_in_stock} bottles</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Maximum Stock:</Text>
                <Text style={styles.infoValue}>{drink.max_stock} bottles</Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: getProgressColor(drink.count_in_stock),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.min(progressPercentage, 100).toFixed(1)}% of max stock
                </Text>
              </View>
            </View>

            {/* Pricing Information Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <CurrencyDollar size={20} color="#4A80F0" />
                <Text style={styles.infoHeaderText}>Pricing Information</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Selling Price:</Text>
                <Text style={styles.infoValue}>{formatCurrency(drink.price)} per bottle</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Buying Price:</Text>
                <Text style={styles.infoValue}>{formatCurrency(drink["buying-price"])} per bottle</Text>
              </View>
            </View>

            {/* Profit Analysis Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Coins size={20} color="#4CAF50" />
                <Text style={styles.infoHeaderText}>Profit Analysis</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profit per Bottle:</Text>
                <Text style={[styles.infoValue, { color: profitPerBottle >= 0 ? '#4CAF50' : '#FF4444' }]}>
                  {formatCurrency(profitPerBottle)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Stock Value (Cost):</Text>
                <Text style={styles.infoValue}>{formatCurrency(totalBuyingValue)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Potential Sales Value:</Text>
                <Text style={styles.infoValue}>{formatCurrency(totalSellingValue)}</Text>
              </View>
              
              <View style={[styles.infoRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Potential Profit:</Text>
                <Text style={[styles.totalValue, { color: totalProfit >= 0 ? '#4CAF50' : '#FF4444' }]}>
                  {formatCurrency(totalProfit)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.editProductButton} 
                onPress={() => setEditing(true)}
              >
                <PencilSimple size={20} color="#fff" weight="bold" />
                <Text style={styles.editProductButtonText}>Edit Product</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.addStockButton} 
                onPress={() => router.push('/add-stock')}
              >
                <Plus size={20} color="#fff" weight="bold" />
                <Text style={styles.addStockButtonText}>Add Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Trash size={20} color="#FF4444" />
                <Text style={styles.deleteButtonText}>Delete Product</Text>
              </TouchableOpacity>
            </View>

            {/* Info Note */}
            <View style={styles.noteContainer}>
              <Info size={16} color="#4A80F0" weight="duotone" />
              <Text style={styles.noteText}>
                Tap the pencil icon to edit product details, or use the buttons above to manage this drink.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
  editButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  editForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  warningText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  editProfitPreview: {
    backgroundColor: '#E8F7E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  editProfitPreviewWarning: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF4444',
  },
  editProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editProfitLabel: {
    fontSize: 14,
    color: '#666',
  },
  editProfitValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editProfitWarning: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  editProductButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A80F0',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    minWidth: '30%',
  },
  editProductButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addStockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    minWidth: '30%',
  },
  addStockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
    minWidth: '30%',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4A80F0',
    lineHeight: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});