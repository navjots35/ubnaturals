"use client";
import { useState, useEffect } from "react";

// Discount calculation types
interface DiscountBreakdown {
  base: number;
  loyalty: number;
  bulk: number;
  total: number;
}

interface UserState {
  isReturning: boolean;
  name: string;
  persona: string;
}

// UB Naturals product data
interface Product {
  id: string;
  name: string;
  price: number;
  size: '250ml' | '500ml';
  category: string;
  image?: string;
}

const UB_PRODUCTS: Product[] = [
  { id: 'black-thunder', name: 'Black Thunder Active+', price: 3299, size: '500ml', category: 'Performance', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-2-520x520.webp' },
  { id: 'liver-kidney', name: 'Liver Kidney Revitalizer', price: 1499, size: '500ml', category: 'Detox', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-8-520x520.webp' },
  { id: 'liver-care', name: 'Liver Care Advance', price: 1099, size: '500ml', category: 'Liver Health', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-5-520x520.webp' },
  { id: 'immunity-lung', name: 'Immunity Lung Detox', price: 1499, size: '500ml', category: 'Immunity', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-7-520x520.webp' }
];

// 250ml variants
const UB_PRODUCTS_250ML: Product[] = [
  { id: 'black-thunder-250', name: 'Black Thunder Active+', price: 1799, size: '250ml', category: 'Performance', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-2-520x520.webp' },
  { id: 'liver-kidney-250', name: 'Liver Kidney Revitalizer', price: 799, size: '250ml', category: 'Detox', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-8-520x520.webp' },
  { id: 'liver-care-250', name: 'Liver Care Advance', price: 2199, size: '250ml', category: 'Liver Health', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-5-520x520.webp' },
  { id: 'immunity-lung-250', name: 'Immunity Lung Detox', price: 799, size: '250ml', category: 'Immunity', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-7-520x520.webp' }
];

const ALL_PRODUCTS = [...UB_PRODUCTS, ...UB_PRODUCTS_250ML];

// Upsell packs and combos data
const UPSELL_PACKS = [
  {
    id: 'pack-immunity-2',
    type: 'pack',
    title: 'Pack of 2',
    product: UB_PRODUCTS[1], // Immunity & Lung Detox
    quantity: 2,
    originalPrice: 2998,
    discountedPrice: 2399,
    savings: 599
  },
  {
    id: 'pack-liver-3',
    type: 'pack', 
    title: 'Pack of 3',
    product: UB_PRODUCTS[2], // Liver & Kidney Revitalizer
    quantity: 3,
    originalPrice: 4497,
    discountedPrice: 3149,
    savings: 1348
  },
  {
    id: 'pack-thunder-2',
    type: 'pack',
    title: 'Pack of 2', 
    product: UB_PRODUCTS[0], // Black Thunder Active+
    quantity: 2,
    originalPrice: 6598,
    discountedPrice: 5279,
    savings: 1319
  }
];

const UPSELL_COMBOS = [
  {
    id: 'combo-1',
    type: 'combo',
    title: 'Combo 1',
    products: [UB_PRODUCTS[1], UB_PRODUCTS[2]], // Immunity + Liver & Kidney
    originalPrice: 2998,
    discountedPrice: 2399,
    savings: 599
  },
  {
    id: 'combo-2', 
    type: 'combo',
    title: 'Combo 2',
    products: [UB_PRODUCTS[0], UB_PRODUCTS[1]], // Black Thunder + Immunity
    originalPrice: 4798,
    discountedPrice: 3839,
    savings: 959
  },
  {
    id: 'combo-3',
    type: 'combo', 
    title: 'Combo 3',
    products: [UB_PRODUCTS[0], UB_PRODUCTS[3]], // Black Thunder + Liver Care
    originalPrice: 5498,
    discountedPrice: 4399,
    savings: 1099
  }
];

const ALL_UPSELLS = [...UPSELL_PACKS, ...UPSELL_COMBOS];

// Function to generate upsells based on bottle size
// Helper function to get product by ID and size
const getProductBySize = (productId: string, size: '250ml' | '500ml'): Product | null => {
  const baseId = productId.replace('-250', '');
  if (size === '500ml') {
    return UB_PRODUCTS.find(p => p.id === baseId) || null;
  } else {
    return UB_PRODUCTS_250ML.find(p => p.id === `${baseId}-250`) || null;
  }
};

const generateUpsells = (size: '250ml' | '500ml', currentCartItems: Array<{id: string, name: string, price: number, quantity: number, size: string, category: string, image?: string}>) => {
  const packs: any[] = [];
  const combos: any[] = [];
  
  // Get products in cart
  const cartProductMap = new Map<string, number>();
  currentCartItems.forEach(item => {
    cartProductMap.set(item.id, item.quantity);
  });

  // Generate packs for products in cart
  cartProductMap.forEach((qty, cartProductId) => {
    // Get base product ID (remove -250 suffix if present)
    const baseProductId = cartProductId.replace('-250', '');
    const product = getProductBySize(baseProductId, size);
    if (!product) return;

    // Determine the correct product ID for the selected size
    const targetProductId = size === '500ml' ? baseProductId : `${baseProductId}-250`;
    
    // Check if we should show packs based on quantity of THIS SIZE in cart
    // If the size doesn't exist yet or qty is 0, treat it as qty = 1 so packs will show
    const existingItem = currentCartItems.find(item => item.id === targetProductId);
    const existingQty = existingItem && existingItem.quantity > 0 ? existingItem.quantity : 1;

    // Modified Pack rules - always show both packs for better UX:
    // - Always show pack of 2 and pack of 3 if qty <= 3
    // - If qty >= 4: don't show packs
    if (existingQty <= 3) {
      // Pack of 2
      const pack2Price = product.price * 2;
      const pack2Discounted = Math.round(pack2Price * 0.8);
      packs.push({
        id: `pack-${targetProductId}-2-${size}`,
        type: 'pack',
        title: 'Pack of 2',
        product: { ...product, size },
        productId: targetProductId,
        quantity: 2,
        originalPrice: pack2Price,
        discountedPrice: pack2Discounted,
        savings: pack2Price - pack2Discounted
      });

      // Pack of 3
      const pack3Price = product.price * 3;
      const pack3Discounted = Math.round(pack3Price * 0.7);
      packs.push({
        id: `pack-${targetProductId}-3-${size}`,
        type: 'pack',
        title: 'Pack of 3',
        product: { ...product, size },
        productId: targetProductId,
        quantity: 3,
        originalPrice: pack3Price,
        discountedPrice: pack3Discounted,
        savings: pack3Price - pack3Discounted
      });
    }
  });

  // Generate combos: all products with other products in cart
  const cartProductIds = Array.from(cartProductMap.keys());
  for (let i = 0; i < cartProductIds.length; i++) {
    for (let j = i + 1; j < cartProductIds.length; j++) {
      // Get base product IDs
      const baseId1 = cartProductIds[i].replace('-250', '');
      const baseId2 = cartProductIds[j].replace('-250', '');
      
      // Determine correct product IDs for selected size
      const targetId1 = size === '500ml' ? baseId1 : `${baseId1}-250`;
      const targetId2 = size === '500ml' ? baseId2 : `${baseId2}-250`;
      
      const product1 = getProductBySize(baseId1, size);
      const product2 = getProductBySize(baseId2, size);
      
      if (product1 && product2) {
        const comboPrice = product1.price + product2.price;
        const comboDiscounted = Math.round(comboPrice * 0.8);
        combos.push({
          id: `combo-${targetId1}-${targetId2}-${size}`,
          type: 'combo',
          title: `Combo ${combos.length + 1}`,
          products: [
            { ...product1, size },
            { ...product2, size }
          ],
          productIds: [targetId1, targetId2],
          originalPrice: comboPrice,
          discountedPrice: comboDiscounted,
          savings: comboPrice - comboDiscounted
        });
      }
    }
  }

  return [...packs, ...combos];
};

export default function Home() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [userState, setUserState] = useState<UserState | null>(null);
  const [cartItems, setCartItems] = useState([
    { id: 'black-thunder', name: 'Black Thunder Active+', price: 3299, quantity: 1, size: '500ml', category: 'Performance', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-2-520x520.webp' },
    { id: 'liver-kidney', name: 'Liver Kidney Revitalizer', price: 1499, quantity: 1, size: '500ml', category: 'Detox', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-8-520x520.webp' },
    { id: 'liver-care', name: 'Liver Care Advance', price: 1099, quantity: 1, size: '500ml', category: 'Liver Health', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-5-520x520.webp' },
    { id: 'immunity-lung', name: 'Immunity Lung Detox', price: 1499, quantity: 1, size: '500ml', category: 'Immunity', image: 'https://www.ubnaturals.com/wp-content/uploads/2022/02/1-7-520x520.webp' }
  ]);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [bottleSize, setBottleSize] = useState<'250ml' | '500ml'>('500ml');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [tempCartItems, setTempCartItems] = useState(cartItems);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number, type: 'percentage' | 'fixed'} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isOrderSummaryLoading, setIsOrderSummaryLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [previousPaymentMethod, setPreviousPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [popupMessage, setPopupMessage] = useState<{type: 'saving' | 'extra', amount: number, savings?: number} | null>(null);

  // Helper function to simulate server delay with loading state
  const simulateServerDelay = (callback: () => void) => {
    setIsOrderSummaryLoading(true);
    setTimeout(() => {
      callback();
      setIsOrderSummaryLoading(false);
    }, 3000); // 3 second delay
  };

  // Mock coupon database
  const AVAILABLE_COUPONS = [
    { code: 'WELCOME10', discount: 10, type: 'percentage' as const, description: 'Welcome discount' },
    { code: 'SAVE500', discount: 500, type: 'fixed' as const, description: 'Flat ₹500 off' },
    { code: 'HEALTH20', discount: 20, type: 'percentage' as const, description: 'Health boost discount' },
    { code: 'FIRST15', discount: 15, type: 'percentage' as const, description: 'First order discount' }
  ];

  // Apply coupon function
  const applyCoupon = () => {
    setCouponError('');
    const coupon = AVAILABLE_COUPONS.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    
    if (coupon) {
      simulateServerDelay(() => {
        setAppliedCoupon(coupon);
        setCouponCode('');
        setCouponError('');
      });
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    simulateServerDelay(() => {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    });
  };

  // Track which upsells have been actually applied by user selection
  const [appliedUpsells, setAppliedUpsells] = useState<string[]>([]);
  
  // Track shipping details accordion state
  const [isShippingDetailsOpen, setIsShippingDetailsOpen] = useState(false);

  // Check if an upsell is already applied (based on user selections, not just cart quantities)
  const isUpsellApplied = (upsellId: string) => {
    // In edit mode, don't show any items as applied - clean slate
    if (isEditingOrder) {
      return false;
    }
    return appliedUpsells.includes(upsellId);
  };

  // Handle upsell selection - updates cart quantities
  const toggleUpsellSelection = (upsellId: string) => {
    // Don't allow selection if already applied (unless in edit mode)
    if (!isEditingOrder && isUpsellApplied(upsellId)) {
      return;
    }

    // Use loading state for pack and combo selection
    simulateServerDelay(() => {
      const itemsToUse = isEditingOrder ? tempCartItems : cartItems;
      const currentUpsells = generateUpsells(bottleSize, itemsToUse);
      const upsell = currentUpsells.find(item => item.id === upsellId);
      
      if (!upsell) return;

      const isSelected = selectedUpsells.includes(upsellId);
      
      if (isSelected) {
        // Deselect: revert quantities
        if (upsell.type === 'pack') {
          const productId = (upsell as any).productId;
          const setter = isEditingOrder ? setTempCartItems : setCartItems;
          setter(prev => {
            const item = prev.find(i => i.id === productId && i.size === bottleSize);
            if (item) {
              // If quantity equals pack quantity, revert to 1, otherwise keep current
              const newQty = item.quantity === upsell.quantity ? 1 : Math.max(1, item.quantity - 1);
              if (newQty <= 0) {
                return prev.filter(i => !(i.id === productId && i.size === bottleSize));
              }
              return prev.map(i => i.id === productId && i.size === bottleSize ? { ...i, quantity: newQty } : i);
            }
            return prev;
          });
        } else if (upsell.type === 'combo') {
          const productIds = (upsell as any).productIds;
          const setter = isEditingOrder ? setTempCartItems : setCartItems;
          setter(prev => {
            return prev.map(item => {
              if (productIds.includes(item.id) && item.size === bottleSize) {
                const newQty = Math.max(1, item.quantity - 1);
                return { ...item, quantity: newQty };
              }
              return item;
            }).filter(item => item.quantity > 0);
          });
        }
        setSelectedUpsells(prev => prev.filter(id => id !== upsellId));
        setAppliedUpsells(prev => prev.filter(id => id !== upsellId));
      } else {
        // Select: update quantities
        if (upsell.type === 'pack') {
          const productId = (upsell as any).productId; // This is already the correct ID for the selected size
          const targetQty = upsell.quantity;
          const setter = isEditingOrder ? setTempCartItems : setCartItems;
          setter(prev => {
            const existingItem = prev.find(i => i.id === productId && i.size === bottleSize);
            if (existingItem) {
              // Update quantity to pack quantity (same size, same product)
              return prev.map(i => i.id === productId && i.size === bottleSize ? { ...i, quantity: targetQty } : i);
            } else {
              // Add new item (different size or new product)
              const baseProductId = productId.replace('-250', '');
              const product = getProductBySize(baseProductId, bottleSize);
              if (product) {
                return [...prev, { 
                  id: productId, 
                  name: product.name, 
                  price: product.price, 
                  quantity: targetQty, 
                  size: bottleSize, 
                  category: product.category, 
                  image: product.image || '' 
                }];
              }
              return prev;
            }
          });
        } else if (upsell.type === 'combo') {
          const productIds = (upsell as any).productIds; // These are already correct IDs for selected size
          const products = (upsell as any).products;
          const setter = isEditingOrder ? setTempCartItems : setCartItems;
          setter(prev => {
            const updated = [...prev];
            productIds.forEach((productId: string, index: number) => {
              // Check if item exists with same ID AND size
              const existingIndex = updated.findIndex(i => i.id === productId && i.size === bottleSize);
              if (existingIndex >= 0) {
                // Update quantity (same size, same product)
                updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
              } else {
                // Add new item (different size or new product)
                const product = products[index];
                updated.push({
                  id: productId,
                  name: product.name,
                  price: product.price,
                  quantity: 1,
                  size: bottleSize,
                  category: product.category,
                  image: product.image || ''
                });
              }
            });
            return updated;
          });
        }
        setSelectedUpsells(prev => [...prev, upsellId]);
        
        // Mark as applied (when not in edit mode)
        if (!isEditingOrder) {
          setAppliedUpsells(prev => [...prev, upsellId]);
          // Keep the item in selectedUpsells to show visual feedback
          // It will be cleared when user switches size or starts editing
        }
      }
    });
  };

  // Handle order editing
  const startEditingOrder = () => {
    setTempCartItems([...cartItems]);
    setIsEditingOrder(true);
    // Clear any previous selections to provide clean slate
    setSelectedUpsells([]);
  };

  const cancelEditingOrder = () => {
    setTempCartItems([...cartItems]);
    setIsEditingOrder(false);
  };

  const saveOrderChanges = () => {
    setCartItems([...tempCartItems]);
    setIsEditingOrder(false);
    // Clear selections after saving changes
    setSelectedUpsells([]);
  };

  const updateTempItemQuantity = (itemId: string, newQuantity: number) => {
    simulateServerDelay(() => {
      if (newQuantity <= 0) {
        setTempCartItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        setTempCartItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    });
  };

  const removeTempItem = (itemId: string) => {
    setTempCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Wrapper functions for bottle size changes with loading
  const changeBottleSize = (size: '250ml' | '500ml') => {
    simulateServerDelay(() => {
      setBottleSize(size);
    });
  };

  // Initialize user state on component mount
  useEffect(() => {
    // Simple returning user simulation (50% chance)
    const isReturning = Math.random() > 0.5;
    setUserState({ isReturning, name: 'Customer', persona: 'customer' });
  }, []);

  // Clear selected upsells when bottle size changes (since IDs change)
  useEffect(() => {
    setSelectedUpsells([]);
    setAppliedUpsells([]);
  }, [bottleSize]);

  // Sync tempCartItems with cartItems when not editing
  useEffect(() => {
    if (!isEditingOrder) {
      setTempCartItems([...cartItems]);
    }
  }, [cartItems, isEditingOrder]);

  // Handle payment method change with popup
  const handlePaymentMethodChange = (newMethod: 'razorpay' | 'cod') => {
    if (newMethod === previousPaymentMethod) {
      setPaymentMethod(newMethod);
      return;
    }

    const itemsToUse = isEditingOrder ? tempCartItems : cartItems;
    const subtotal = itemsToUse.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate prepaid pricing
    const prepaidDiscounts = calculateDiscounts(true);
    const prepaidDiscountAmount = (subtotal * prepaidDiscounts.total) / 100;
    const prepaidGst = Math.round((subtotal - prepaidDiscountAmount) * 0.05);
    const prepaidTotal = subtotal - prepaidDiscountAmount + 0 + prepaidGst;
    
    // Calculate COD pricing
    const codDiscounts = calculateDiscounts(false);
    const codDiscountAmount = (subtotal * codDiscounts.total) / 100;
    const codGst = Math.round((subtotal - codDiscountAmount) * 0.05);
    const codTotal = subtotal - codDiscountAmount + 99 + codGst;
    
    const totalSavings = codTotal - prepaidTotal;

    // Update payment method
    setPaymentMethod(newMethod);

    // Show popup based on switch direction
    if (newMethod === 'razorpay') {
      // Switching TO razorpay (saving money)
      setPopupMessage({
        type: 'saving',
        amount: Math.round(totalSavings)
      });
    } else {
      // Switching TO cod (paying extra)
      setPopupMessage({
        type: 'extra',
        amount: Math.round(totalSavings),
        savings: Math.round(totalSavings)
      });
    }
    
    setShowPaymentPopup(true);
    setPreviousPaymentMethod(newMethod);
  };

  // Calculate dynamic discounts
  const calculateDiscounts = (isPrepaid: boolean): DiscountBreakdown => {
    const itemsToUse = isEditingOrder ? tempCartItems : cartItems;
    const totalItems = itemsToUse.reduce((sum, item) => sum + item.quantity, 0);
    
    // Base discount based on bottle quantity
    let baseDiscount = 10; // 1 bottle
    if (totalItems >= 3) baseDiscount = 30; // 3+ bottles
    else if (totalItems >= 2) baseDiscount = 20; // 2 bottles
    
    // Loyalty discount (5%)
    let loyaltyDiscount = 5;
    
    // Bulk discount is now integrated into base discount, so set to 0
    let bulkDiscount = 0;
    
    // Apply COD penalty (50% reduction)
    if (!isPrepaid) {
      loyaltyDiscount = loyaltyDiscount * 0.5;
      bulkDiscount = bulkDiscount * 0.5;
    }
    
    const totalDiscount = baseDiscount + loyaltyDiscount + bulkDiscount;
    
    return {
      base: baseDiscount,
      loyalty: loyaltyDiscount,
      bulk: bulkDiscount,
      total: totalDiscount
    };
  };

  // Calculate pricing
  const calculatePricing = () => {
    // Get current upsells based on bottle size and cart items
    const itemsToUse = isEditingOrder ? tempCartItems : cartItems;
    const currentUpsells = generateUpsells(bottleSize, itemsToUse);
    
    // Calculate selected upsells total (only the savings difference, since quantities are already updated)
    const selectedUpsellsTotal = 0; // Packs/combos update quantities directly, no separate pricing
    
    const subtotal = itemsToUse.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const isPrepaid = paymentMethod === 'razorpay';
    const discounts = calculateDiscounts(isPrepaid);
    
    const discountAmount = (subtotal * discounts.total) / 100;
    
    // Calculate coupon discount
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        couponDiscount = (subtotal * appliedCoupon.discount) / 100;
      } else {
        couponDiscount = appliedCoupon.discount;
      }
    }
    
    const totalDiscountAmount = discountAmount + couponDiscount;
    const shippingFee = isPrepaid ? 0 : 99;
    const gst = Math.round((subtotal - totalDiscountAmount) * 0.05);
    const finalTotal = subtotal - totalDiscountAmount + shippingFee + gst;
    
    return {
      subtotal,
      discounts,
      discountAmount,
      couponDiscount,
      totalDiscountAmount,
      shippingFee,
      gst,
      finalTotal,
      savings: totalDiscountAmount + (isPrepaid ? 99 : 0) // Include saved shipping
    };
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Following Shopflo's Design */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Demo Checkout Button */}
          <div className="animate-fade-in-up mt-8">
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="btn-primary bg-white px-8 py-4 font-semibold focus:outline-none focus:ring-2 transition-all rounded-lg shadow-lg border-2"
              style={{
                color: 'var(--phthalo-green)',
                borderColor: 'var(--phthalo-green)'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement;
                target.style.backgroundColor = 'var(--phthalo-green-lightest)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement;
                target.style.backgroundColor = 'white';
              }}
            >
              🛒 Express Checkout Demo
            </button>
          </div>
        </div>
      </section>

      {/* Checkout Modal - Shopflo Style */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm modal-backdrop"
            onClick={() => setIsCheckoutOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[40vw] bg-white shadow-2xl modal-enter overflow-hidden border border-gray-200 
                         md:right-4 md:top-4 md:bottom-4 md:rounded-2xl
                         sm:rounded-none sm:border-0">
            {/* Payment Method Switch Popup */}
            {showPaymentPopup && popupMessage && (
              <>
                {/* Backdrop overlay to lock background */}
                <div 
                  className="absolute inset-0 z-[59] bg-white/30 backdrop-blur-[1px]"
                  onClick={() => setShowPaymentPopup(false)}
                />
                {/* Popup */}
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-3 pointer-events-none">
                  <div className={`relative rounded-2xl shadow-2xl p-5 sm:p-6 max-w-md w-full pointer-events-auto animate-fade-in-up border-2 ${
                    popupMessage.type === 'extra' 
                      ? 'bg-gradient-to-br from-orange-50 to-white border-orange-300'
                      : 'bg-gradient-to-br from-green-50 to-white border-green-300'
                  }`}
                       style={{
                         background: popupMessage.type === 'extra'
                           ? 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
                           : 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
                         boxShadow: popupMessage.type === 'extra'
                           ? '0 20px 60px rgba(234, 88, 12, 0.25), 0 0 0 1px rgba(234, 88, 12, 0.15)'
                           : '0 20px 60px rgba(26, 77, 58, 0.25), 0 0 0 1px rgba(26, 77, 58, 0.15)'
                       }}>
                    {/* Close Button */}
                    <button
                      onClick={() => setShowPaymentPopup(false)}
                      className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full transition-all hover:scale-110 ${
                        popupMessage.type === 'extra'
                          ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Content */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        popupMessage.type === 'extra'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {popupMessage.type === 'saving' ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623A11.99 11.99 0 0 0 20.402 6 11.959 11.959 0 0 1 12 2.713Z" />
                            </svg>
                            <span>Great Choice!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <span>Notice</span>
                          </>
                        )}
                      </div>

                      {/* 3D Rupee Icon with Amount Badge */}
                      <div className="relative flex items-center justify-center">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                          <img 
                            src="/image.png" 
                            alt="Rupee" 
                            className="w-full h-full object-contain drop-shadow-xl animate-bounce-slow"
                            style={{ filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25))' }}
                          />
                        </div>
                        {/* Amount Badge */}
                        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full shadow-lg ${
                          popupMessage.type === 'extra'
                            ? 'bg-orange-500 text-white'
                            : 'bg-green-600 text-white'
                        }`}>
                          <span className="text-sm font-bold">₹{popupMessage.amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Main Message */}
                      {popupMessage.type === 'saving' ? (
                        <div className="w-full space-y-2.5">
                          {/* Savings Amount - Combined with heading */}
                          <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-bold mb-1" style={{color: 'var(--phthalo-green)'}}>
                              You&apos;re Saving ₹{popupMessage.amount.toLocaleString()}!
                            </h3>
                            <p className="text-xs text-gray-600">Smart choice! You&apos;re getting the best deal with online payment.</p>
                          </div>

                          {/* Compact Benefits List - Horizontal */}
                          <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
                            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700 font-medium">Free Shipping</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700 font-medium">Bank Offers</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700 font-medium">Cashbacks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-2.5">
                          {/* Extra Charges - Combined with heading */}
                          <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-bold mb-1 text-gray-900">
                              You&apos;re Paying Extra ₹{popupMessage.amount.toLocaleString()} with COD
                            </h3>
                            
                          </div>

                          {/* Compact Drawbacks List - Horizontal */}
                          <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-200">
                            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-gray-700 font-medium">No Free Shipping</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-gray-700 font-medium">No Bank Offers</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <svg className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-gray-700 font-medium">No Cashbacks</span>
                              </div>
                            </div>
                          </div>

                          {/* Call to Action */}
                          <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span className="text-xs text-gray-700 font-medium">Switch to Razorpay and save</span>
                              <span className="text-sm font-bold text-green-600">₹{popupMessage.savings?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className={`flex flex-col h-full ${showPaymentPopup ? 'pointer-events-none' : ''}`}>
              {/* Minimal Header */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                  <span className="hidden sm:inline">Express Checkout</span>
                  <span className="sm:hidden">Checkout</span>
                </h2>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {isOrderSummaryLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-xl shadow-2xl border border-green-200">
                      <div className="relative">
                        <div className="w-10 h-10 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-700 font-medium text-xs">Updating your order...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto modal-content">
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Cart Summary - Critical Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span className="hidden sm:inline">Order Summary</span>
                        <span className="sm:hidden">Order</span>
                        <span className="text-xs font-normal text-gray-500">({(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      </h3>
                      
                      {/* Edit Order Button */}
                      {!isEditingOrder ? (
                        <button 
                          onClick={startEditingOrder}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border-2 transition-all hover:shadow-md"
                          style={{
                            color: 'var(--phthalo-green)',
                            borderColor: 'var(--phthalo-green)',
                            backgroundColor: 'white'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.backgroundColor = 'var(--phthalo-green-lightest)';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.backgroundColor = 'white';
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                          <span className="hidden sm:inline">Modify Order</span>
                          <span className="sm:hidden">Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={cancelEditingOrder}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                          <button 
                            onClick={saveOrderChanges}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border-2 transition-all hover:shadow-md"
                            style={{
                              color: 'white',
                              borderColor: 'var(--phthalo-green)',
                              backgroundColor: 'var(--phthalo-green)'
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span className="hidden sm:inline">Save Changes</span>
                            <span className="sm:hidden">Save</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {/* Cart Items */}
                      {!isEditingOrder ? (
                        // Regular view
                        cartItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-gray-600">{item.size} • Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2 shrink-0">
                              <div>
                                <div className="font-semibold text-gray-900 text-xs sm:text-sm">₹{Math.round(item.price * item.quantity).toLocaleString()}</div>
                                {item.quantity > 1 && (
                                  <div className="text-xs text-gray-500">₹{item.price.toLocaleString()} each</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Editing view
                        tempCartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-gray-600">
                                  {item.size} · ₹{Math.round(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 ml-auto">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateTempItemQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isOrderSummaryLoading}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                    item.quantity <= 1 || isOrderSummaryLoading
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-2' 
                                      : 'bg-white border-2 text-gray-800 hover:text-white hover:border-green-500'
                                  }`}
                                  style={{
                                    borderColor: item.quantity <= 1 ? '#e5e7eb' : 'var(--phthalo-green)'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (item.quantity > 1) {
                                      const target = e.target as HTMLElement;
                                      target.style.backgroundColor = 'var(--phthalo-green)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (item.quantity > 1) {
                                      const target = e.target as HTMLElement;
                                      target.style.backgroundColor = 'white';
                                    }
                                  }}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                  </svg>
                                </button>
                                <span className="w-6 text-center font-semibold text-gray-800 text-xs sm:text-sm">{item.quantity}</span>
                                <button
                                  onClick={() => updateTempItemQuantity(item.id, item.quantity + 1)}
                                  disabled={isOrderSummaryLoading}
                                  className={`w-6 h-6 rounded-full bg-white border-2 text-gray-600 hover:text-white flex items-center justify-center transition-colors ${
                                    isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  style={{
                                    borderColor: 'var(--phthalo-green)'
                                  }}
                                  onMouseEnter={(e) => {
                                    const target = e.target as HTMLElement;
                                    target.style.backgroundColor = 'var(--phthalo-green)';
                                  }}
                                  onMouseLeave={(e) => {
                                    const target = e.target as HTMLElement;
                                    target.style.backgroundColor = 'white';
                                  }}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                                  </svg>
                                </button>
                              </div>

                              <button
                                onClick={() => removeTempItem(item.id)}
                                className="sm:hidden text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>

                              {/* Price and Remove */}
                              <div className="hidden sm:flex text-right flex-row items-center gap-2">
                                <button
                                  onClick={() => removeTempItem(item.id)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Empty cart message during editing */}
                      {isEditingOrder && tempCartItems.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                          <p className="text-xs sm:text-sm">Your cart is empty</p>
                          <p className="text-xs text-gray-400 mt-1">Add some products to continue</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Upsell/Cross-sell Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-row flex-wrap sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="hidden sm:inline">Save More with Packs & Combos</span>
                        <span className="sm:hidden">Packs & Combos</span>
                      </h3>
                      {/* Bottle Size Toggle */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5 self-start sm:self-auto">
                        <button
                          onClick={() => changeBottleSize('250ml')}
                          disabled={isOrderSummaryLoading}
                          className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                            bottleSize === '250ml'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          250ml
                        </button>
                        <button
                          onClick={() => changeBottleSize('500ml')}
                          disabled={isOrderSummaryLoading}
                          className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                            bottleSize === '500ml'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          } ${isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          500ml
                        </button>
                      </div>
                    </div>
                    
                    {/* Horizontal Scroller */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-2 min-w-max">
                        {generateUpsells(bottleSize, isEditingOrder ? tempCartItems : cartItems).map((item) => {
                          const isSelected = selectedUpsells.includes(item.id);
                          const isApplied = isUpsellApplied(item.id);
                          // Allow clicking if in edit mode, or if not applied, or if selected (to allow deselection), and not loading
                          const isClickable = (isEditingOrder || !isApplied || isSelected) && !isOrderSummaryLoading;
                          
                          return (
                          <div 
                            key={item.id} 
                            className={`shrink-0 w-32 sm:w-36 border-2 rounded-lg p-2 transition-all ${
                              isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                            } ${
                              isApplied 
                                ? 'border-green-600 bg-green-100 shadow-lg' 
                                : isSelected 
                                ? 'border-green-500 bg-green-50 shadow-lg' 
                                : 'border-gray-200 hover:border-green-300 bg-white'
                            }`}
                            onClick={() => isClickable && toggleUpsellSelection(item.id)}
                          >
                            {/* Pack Layout */}
                            {item.type === 'pack' && (
                              <>
                                <div className="flex items-center justify-center mb-1.5 sm:mb-2 relative">
                                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm text-center">{item.title}</h4>
                                  {(isSelected || isApplied) && (
                                    <div className={`absolute right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                                      isApplied ? 'bg-green-700' : 'bg-green-600'
                                    }`}>
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Repeated Bottle Images */}
                                <div className="flex items-center justify-center gap-0.5 mb-1.5 py-1">
                                  {Array.from({ length: (item as any).quantity }).map((_, index) => (
                                    <div key={index} className="w-5 h-5 sm:w-6 sm:h-6 rounded overflow-hidden bg-white border border-gray-200">
                                      <img 
                                        src={(item as any).product.image} 
                                        alt={(item as any).product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="text-center mb-1.5 sm:mb-2">
                                  <h5 className="font-medium text-gray-900 text-xs leading-tight truncate">{(item as any).product.name}</h5>
                                  <p className="text-xs text-gray-500">{(item as any).quantity} × {(item as any).product.size}</p>
                                </div>
                              </>
                            )}
                            
                            {/* Combo Layout */}
                            {item.type === 'combo' && (
                              <>
                                <div className="flex items-center justify-center mb-1.5 sm:mb-2 relative">
                                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm text-center">{item.title}</h4>
                                  {(isSelected || isApplied) && (
                                    <div className={`absolute right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center ${
                                      isApplied ? 'bg-green-700' : 'bg-green-600'
                                    }`}>
                                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Two Different Bottle Images */}
                                <div className="flex items-center justify-center gap-1 mb-1.5 py-1">
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded overflow-hidden bg-white border border-gray-200">
                                    <img 
                                      src={(item as any).products[0].image} 
                                      alt={(item as any).products[0].name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-xs font-bold text-green-600">+</div>
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded overflow-hidden bg-white border border-gray-200">
                                    <img 
                                      src={(item as any).products[1].image} 
                                      alt={(item as any).products[1].name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                                
                                <div className="text-center mb-1.5 sm:mb-2">
                                  <div className="space-y-0.5">
                                    {(item as any).products.map((product: any, index: number) => (
                                      <p key={index} className="text-xs text-gray-600 leading-tight truncate">{product.name}</p>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* Common Pricing */}
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                    <span className="text-xs sm:text-sm font-bold" style={{color: 'var(--phthalo-green)'}}>
                                      ₹{item.discountedPrice.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-500 line-through">
                                      ₹{item.originalPrice.toLocaleString()}
                                    </span>
                                  </div>
                                  {isApplied ? (
                                    <p className="text-xs text-green-700 font-bold">Applied!</p>
                                  ) : (
                                    <p className="text-xs text-green-600 font-semibold">Save ₹{item.savings}!</p>
                                  )}
                                </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="flex justify-center">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                        Scroll to see more offers
                      </p>
                    </div>
                  </div>

                  {/* Shipping & Billing Details */}
                  <details 
                    className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg overflow-hidden"
                    onToggle={(e) => setIsShippingDetailsOpen((e.target as HTMLDetailsElement).open)}
                  >
                    <summary className="cursor-pointer flex items-center justify-between p-2.5 sm:p-3 text-gray-700 hover:text-gray-900 font-medium hover:bg-green-25 transition-colors group">
                      <span className="flex items-center gap-1.5">
                        <img src="/shipping-icon.svg" alt="Shipping" width={14} height={14} className="sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Shipping & Billing Details</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {isShippingDetailsOpen && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle edit action here
                            }}
                            className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                            <span className="hidden sm:inline">Edit Details</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                        )}
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </summary>
                      
                      <div className="p-2.5 sm:p-3 space-y-2">
                        {/* Contact Information */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">Mobile</span>
                            <span className="font-semibold text-gray-900">+91 9999333966</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">Email</span>
                            <span className="font-semibold text-gray-900 truncate ml-2">puneettest@test.com</span>
                          </div>
                        </div>
                        
                        {/* Billing Address */}
                        <div className="border-t border-green-200 pt-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs gap-1 sm:gap-0">
                            <span className="text-gray-600 flex items-center gap-1 font-medium">
                              Billing Address
                            </span>
                            <div className="text-left sm:text-right">
                              <div className="font-semibold text-gray-900">Sridevi House Kollam</div>
                              <div className="text-gray-600">Kollam, Kerala, India</div>
                              <div className="text-gray-600">PIN: 691511</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Shipping Address */}
                        <div className="border-t border-green-200 pt-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs gap-1 sm:gap-0">
                            <span className="text-gray-600 flex items-center gap-1 font-medium">
                              Shipping Address
                            </span>
                            <div className="text-left sm:text-right">
                              <div className="font-semibold text-gray-900">Sridevi House Kollam</div>
                              <div className="text-gray-600">Kollam, Kerala, India</div>
                              <div className="text-gray-600">PIN: 691511</div>
                              <div className="text-xs text-green-600 font-medium mt-1">Same as billing</div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </details>

                  
                  {/* Total Cost Breakdown */}
                  {(() => {
                    const pricing = calculatePricing();
                    return (
                      <div className="space-y-3">
                        
                        
                          <div className="bg-gradient-to-br from-green-50 to-white p-2.5 sm:p-3 rounded-lg border border-green-200">
                          
                          {/* Your Savings Breakdown */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 pb-1.5 border-b border-green-200">
                              <img src="/dollar-icon.svg" alt="Savings" width={14} height={14} className="sm:w-4 sm:h-4" />
                              <h4 className="font-medium text-gray-800 text-xs sm:text-sm">Your Savings Breakdown</h4>
                            </div>
                            
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal ({(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span className="font-semibold text-green-600">₹{Math.round(pricing.subtotal).toLocaleString()}</span>
                              </div>
                              
                              <div className="space-y-1 border-l-4 border-green-500 pl-2 bg-green-25">
                                <div className="flex justify-between text-green-700">
                                  <span className="text-xs">✓ Base Discount ({pricing.discounts.base}%) - {(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} bottle{(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}</span>
                                  <span className="text-xs">-₹{Math.round(pricing.subtotal * pricing.discounts.base / 100)}</span>
                                </div>
                                <div className="flex justify-between text-green-700">
                                  <span className="text-xs">✓ {userState?.isReturning ? 'Loyalty' : 'Welcome'} Discount ({pricing.discounts.loyalty}%)</span>
                                  <span className="text-xs">-₹{Math.round(pricing.subtotal * pricing.discounts.loyalty / 100)}</span>
                                </div>
                                {appliedCoupon && (
                                  <div className="flex justify-between text-green-700">
                                    <span className="text-xs">✓ Coupon ({appliedCoupon.code})</span>
                                    <span className="text-xs">-₹{Math.round(pricing.couponDiscount)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Shipping</span>
                                <span className={pricing.shippingFee === 0 ? 'text-green-600 font-semibold' : ''}>
                                  {pricing.shippingFee === 0 ? 'FREE' : `₹${pricing.shippingFee}`}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>GST (5%)</span>
                                <span>₹{pricing.gst}</span>
                              </div>
                              
                              <div className="border-t pt-1.5 flex justify-between font-bold text-sm sm:text-base text-gray-900">
                                <span>Total</span>
                                <span style={{color: 'var(--phthalo-green)'}}>₹{Math.round(pricing.finalTotal).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coupon Code Section */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg p-2.5 sm:p-3">
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1.5 border-b border-green-200">
                          <img src="/coupon-icon.svg" alt="Coupon" width={14} height={14} className="sm:w-4 sm:h-4" />
                          <h4 className="font-medium text-gray-800 text-xs sm:text-sm">Have a Coupon Code?</h4>
                        </div>
                        
                        {!appliedCoupon ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code"
                                disabled={isOrderSummaryLoading}
                                className={`flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-xs sm:text-sm ${
                                  isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onKeyPress={(e) => e.key === 'Enter' && !isOrderSummaryLoading && applyCoupon()}
                              />
                              <button
                                onClick={applyCoupon}
                                disabled={!couponCode.trim() || isOrderSummaryLoading}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 font-semibold rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                style={{
                                  color: couponCode.trim() ? 'white' : 'var(--phthalo-green)',
                                  backgroundColor: couponCode.trim() ? 'var(--phthalo-green)' : 'white',
                                  borderColor: 'var(--phthalo-green)'
                                }}
                              >
                                Apply
                              </button>
                            </div>
                            
                            {couponError && (
                              <div className="flex items-center gap-2 text-red-600 text-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                {couponError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-green-800 text-xs sm:text-sm">{appliedCoupon.code} Applied!</p>
                                <p className="text-xs text-green-600">
                                  {appliedCoupon.type === 'percentage' 
                                    ? `${appliedCoupon.discount}% discount` 
                                    : `₹${appliedCoupon.discount} off`
                                  }
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={removeCoupon}
                              disabled={isOrderSummaryLoading}
                              className={`text-red-600 hover:text-red-800 transition-colors ${
                                isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Sticky Footer Bar */}
              <div className={`sticky bottom-0 border-t ${
                paymentMethod === 'cod'
                  ? 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
                  : 'bg-gradient-to-br from-green-50 to-white border-green-200'
              }`} style={{
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1), 0 -4px 16px rgba(0, 0, 0, 0.05)'
              }}>
                {/* Payment Method Selection & Messaging */}
                {(() => {
                  const itemsToUse = isEditingOrder ? tempCartItems : cartItems;
                  const subtotal = itemsToUse.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  
                  // Calculate prepaid pricing
                  const prepaidDiscounts = calculateDiscounts(true);
                  const prepaidDiscountAmount = (subtotal * prepaidDiscounts.total) / 100;
                  const prepaidGst = Math.round((subtotal - prepaidDiscountAmount) * 0.05);
                  const prepaidTotal = subtotal - prepaidDiscountAmount + 0 + prepaidGst;
                  
                  // Calculate COD pricing
                  const codDiscounts = calculateDiscounts(false);
                  const codDiscountAmount = (subtotal * codDiscounts.total) / 100;
                  const codGst = Math.round((subtotal - codDiscountAmount) * 0.05);
                  const codTotal = subtotal - codDiscountAmount + 99 + codGst;
                  
                  const totalSavings = codTotal - prepaidTotal;

                  return (
                    <>
                      {/* Payment Method Selector */}
                      <div className={`px-2.5 sm:px-3 py-2 sm:py-3 border-b ${
                        paymentMethod === 'cod' ? 'border-orange-200' : 'border-green-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {/* Payment Method Buttons */}
                          <div className="flex gap-1.5 sm:gap-2 flex-1">
                            <button
                              onClick={() => handlePaymentMethodChange('razorpay')}
                              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all ${
                                paymentMethod === 'razorpay'
                                  ? 'border-green-500 bg-white text-gray-900 shadow-lg'
                                  : 'border-gray-300 text-gray-700 hover:border-green-300 hover:bg-green-50'
                              }`}
                            >
                              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 ${
                                paymentMethod === 'razorpay' ? 'border-green-500 bg-green-500' : 'border-gray-400'
                              }`}></div>
                              <span className="font-semibold text-xs">Pay with Razorpay</span>
                            </button>
                            
                            <button
                              onClick={() => handlePaymentMethodChange('cod')}
                              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all ${
                                paymentMethod === 'cod'
                                  ? 'border-orange-500 bg-white text-gray-900 shadow-lg'
                                  : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                            >
                              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 ${
                                paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500' : 'border-gray-400'
                              }`}></div>
                              <span className="font-semibold text-xs">
                                <span className="hidden sm:inline">Cash on Delivery</span>
                                <span className="sm:hidden">COD</span>
                              </span>
                            </button>
                          </div>
                        </div>
                        
                      </div>
                    </>
                  );
                })()}

                {/* Dynamic Payment Button */}
                <div className="p-2.5 sm:p-3 pb-2.5 sm:pb-3">
                  {(() => {
                    const pricing = calculatePricing();
                    return (
                      <div className="space-y-1.5 sm:space-y-2">
                        <button 
                          className="w-full py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-lg relative overflow-hidden hover:shadow-xl transform hover:scale-[1.02]"
                          style={{
                            background: paymentMethod === 'cod' ? '#331500' : '#0B1C15',
                            color: 'white'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"></div>
                          <div className="relative flex items-center justify-center gap-1.5 sm:gap-2">
                            {paymentMethod === 'razorpay' ? (
                              <>
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623A11.99 11.99 0 0 0 20.402 6 11.959 11.959 0 0 1 12 2.713Z" />
                                </svg>
                                <span>Pay ₹{Math.round(pricing.finalTotal).toLocaleString()} Securely</span>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-white"></div>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                                <span>Place Order for ₹{Math.round(pricing.finalTotal).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </button>
                        <p className={`text-center text-xs ${
                          paymentMethod === 'cod' ? 'text-gray-600' : 'text-gray-600'
                        }`}>
                          Your payment information is encrypted and never stored
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Security Trust Indicators - Bottom of Sticky Bar */}
                <div className={`px-2.5 sm:px-3 py-1.5 sm:py-2 border-t ${
                  paymentMethod === 'cod' ? 'border-orange-200' : 'border-green-200'
                }`}>
                  <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-700">
                      <svg className={`w-3 h-3 ${paymentMethod === 'cod' ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623A11.99 11.99 0 0 0 20.402 6 11.959 11.959 0 0 1 12 2.713Z" />
                      </svg>
                      <span className="font-medium text-xs">
                        <span className="hidden sm:inline">256-bit SSL</span>
                        <span className="sm:hidden">SSL</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <svg className={`w-3 h-3 ${paymentMethod === 'cod' ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span className="font-medium text-xs">
                        <span className="hidden sm:inline">Bank-level Security</span>
                        <span className="sm:hidden">Secure</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <svg className={`w-3 h-3 ${paymentMethod === 'cod' ? 'text-orange-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span className="font-medium text-xs">
                        <span className="hidden sm:inline">PCI Compliant</span>
                        <span className="sm:hidden">PCI</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
