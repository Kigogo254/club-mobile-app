import React, { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Printer,
  DownloadSimple,
  ShoppingBag,
  Cube,
  Plus,
  ArrowsClockwise,
  Coins,
} from 'phosphor-react-native';
import { Drink } from '@/types/drink';

export default function StockReportScreen() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    fetchDrinks();
    updateDateTime();
  }, []);

  const updateDateTime = () => {
    const now = new Date();
    
    // Format: "Monday, February 16, 2026, 14:30" (24-hour format, no seconds)
    const formatted = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    setCurrentDateTime(formatted);
  };

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
      Alert.alert('Error', 'Failed to load stock data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrinks();
    updateDateTime();
  };

  const calculateTotals = () => {
    const totalItems = drinks.reduce((sum, drink) => sum + drink.count_in_stock, 0);
    // Calculate total value using buying-price (cost price)
    const totalValue = drinks.reduce((sum, drink) => {
      const buyingPrice = (drink as any)["buying-price"] || 0;
      return sum + (drink.count_in_stock * buyingPrice);
    }, 0);
    
    return { totalItems, totalValue };
  };

  const formatCurrency = (amount: number) => {
    return `Ksh. ${amount.toFixed(2)}`;
  };

  const getBuyingPrice = (drink: Drink): number => {
    return (drink as any)["buying-price"] || 0;
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const totals = calculateTotals();
      
      // Create HTML content with Ksh. currency and buying price
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              margin: 30px; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; font-size: 28px; margin-bottom: 5px; }
            h2 { color: #666; font-size: 18px; margin-bottom: 20px; font-weight: normal; }
            .date { color: #888; font-size: 14px; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #4A80F0; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .price, .stock, .total { text-align: right; }
            .totals { margin-top: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .grand-total { font-size: 20px; font-weight: bold; color: #4A80F0; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd; }
            footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
            .note { font-size: 12px; color: #666; font-style: italic; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Stock Report (Cost Value)</h1>
            <h2>Current Stock Status - Buying Price</h2>
            <div class="date">Generated on: ${currentDateTime}</div>
            <div class="note">* Values calculated using buying price (cost)</div>
            
            <table>
              <thead>
                <tr>
                  <th>Drink Name</th>
                  <th class="price">Buying Price (Ksh.)</th>
                  <th class="stock">In Stock</th>
                  <th class="total">Total Cost (Ksh.)</th>
                </tr>
              </thead>
              <tbody>
                ${drinks.map(drink => {
                  const buyingPrice = getBuyingPrice(drink);
                  return `
                    <tr>
                      <td>${drink.name}</td>
                      <td class="price">Ksh. ${buyingPrice.toFixed(2)}</td>
                      <td class="stock">${drink.count_in_stock}</td>
                      <td class="total">Ksh. ${(drink.count_in_stock * buyingPrice).toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <h3 style="margin-top: 0;">Summary Totals (Cost)</h3>
              <div class="total-row">
                <span>Total Items in Stock:</span>
                <strong>${totals.totalItems}</strong>
              </div>
              <div class="total-row">
                <span>Total Stock Cost:</span>
                <strong>Ksh. ${totals.totalValue.toFixed(2)}</strong>
              </div>
              <div class="grand-total">
                <span>Total Inventory Cost:</span>
                <span> Ksh. ${totals.totalValue.toFixed(2)}</span>
              </div>
            </div>
            
            <footer>
              Generated by Admin App • ${currentDateTime}
            </footer>
          </div>
        </body>
        </html>
      `;

      // Generate filename
      const fileName = `stock_report_${Date.now()}.html`;
      
      // Get the document directory
      const documentDirectory = FileSystem.documentDirectory;
      
      if (!documentDirectory) {
        throw new Error('Could not access device storage');
      }

      // Create full file path
      const fileUri = documentDirectory + fileName;
      
      console.log('Writing to:', fileUri);
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      
      console.log('File written successfully');

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File was not created');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('Sharing available:', isAvailable);
      
      if (isAvailable) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'Share Stock Report',
        });
      } else {
        Alert.alert('Success', 'Report saved to device');
      }

    } catch (error) {
      console.error('Error details:', error);
      Alert.alert(
        'Error',
        'Failed to generate report: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    generatePDF();
  };

  const handleDownload = () => {
    generatePDF();
  };

  const handleAddStock = () => {
    router.push('/add-stock');
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

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Stock Report (Cost)</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handlePrint}
            disabled={generatingPDF}
          >
            <Printer size={22} color="#4A80F0" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleDownload}
            disabled={generatingPDF}
          >
            <DownloadSimple size={22} color="#4A80F0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Current Stock as at:</Text>
          <Text style={styles.dateValue}>{currentDateTime}</Text>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <ArrowsClockwise size={18} color="#4A80F0" />
            <Text style={styles.refreshButtonText}>Refresh Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <Coins size={16} color="#4A80F0" weight="duotone" />
          <Text style={styles.noteText}>
            Values shown are based on buying price (cost), not selling price
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, styles.drinkNameCol]}>Drink Name</Text>
          <Text style={[styles.columnHeader, styles.priceCol]}>Buying Price</Text>
          <Text style={[styles.columnHeader, styles.stockCol]}>In Stock</Text>
          <Text style={[styles.columnHeader, styles.totalCol]}>Total Cost</Text>
        </View>

        <View style={styles.tableBody}>
          {drinks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No drinks found</Text>
            </View>
          ) : (
            drinks.map((drink, index) => {
              const buyingPrice = getBuyingPrice(drink);
              return (
                <View key={drink.id} style={[styles.tableRow, index % 2 === 0 && styles.rowEven]}>
                  <Text style={[styles.cell, styles.drinkNameCol]}>{drink.name}</Text>
                  <Text style={[styles.cell, styles.priceCol]}>{formatCurrency(buyingPrice)}</Text>
                  <Text style={[styles.cell, styles.stockCol]}>{drink.count_in_stock}</Text>
                  <Text style={[styles.cell, styles.totalCol]}>
                    {formatCurrency(drink.count_in_stock * buyingPrice)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.totalsContainer}>
          <Text style={styles.totalsTitle}>Summary Totals (Cost)</Text>
          
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Cube size={24} color="#4A80F0" />
              <Text style={styles.totalLabel}>Total Items</Text>
              <Text style={styles.totalValue}>{totals.totalItems}</Text>
            </View>
            
            <View style={styles.totalItem}>
              <ShoppingBag size={24} color="#4A80F0" />
              <Text style={styles.totalLabel}>Total Cost (Ksh.)</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.totalValue)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddStock}>
          <Plus size={20} color="#fff" weight="bold" />
          <Text style={styles.addButtonText}>Add Stock</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by Admin App</Text>
          <Text style={styles.footerDate}>{currentDateTime}</Text>
        </View>

        {generatingPDF && (
          <View style={styles.pdfOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.pdfOverlayText}>Generating Report...</Text>
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#4A80F0',
  },
  refreshButtonText: {
    color: '#4A80F0',
    fontSize: 14,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    gap: 8,
    alignItems: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4A80F0',
    lineHeight: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4A80F0',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  columnHeader: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  drinkNameCol: {
    flex: 2,
  },
  priceCol: {
    flex: 1.2,
    textAlign: 'right',
  },
  stockCol: {
    flex: 0.8,
    textAlign: 'right',
  },
  totalCol: {
    flex: 1.5,
    textAlign: 'right',
  },
  tableBody: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  totalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  footerDate: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 2,
  },
  pdfOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfOverlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});