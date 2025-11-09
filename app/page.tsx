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
          {/* Badge - New feature announcement like Shopflo */}
          <div className="animate-fade-in-up mb-8">
            <span className="inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              ✨ New wellness line now available
            </span>
          </div>

          {/* Main Headline - Bold and Impactful like Shopflo */}
          <h1 className="animate-fade-in-up mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Your wellness customers are
            <span className="block text-green-600 metric-number">ready to transform</span>
          </h1>
          
          {/* Subheading - Clear value proposition */}
          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-xl text-gray-600 leading-relaxed">
            Increase your customer satisfaction with UB Naturals&apos; premium, science-backed natural products and sustainable wellness solutions.
          </p>

          {/* CTA Section - Email capture like Shopflo */}
          <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="flex w-full max-w-md shadow-lg rounded-lg overflow-hidden">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 border-0 px-4 py-4 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <button className="btn-primary bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
                Get Started
              </button>
            </div>
          </div>

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

          {/* Form Success Message Area - Shopflo style */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 opacity-0 transition-opacity">
              Thank you! Your submission has been received!
            </p>
            {/* Error message - would be conditionally shown */}
            <p className="text-sm text-red-500 hidden opacity-0 transition-opacity">
              Oops! Something went wrong while submitting the form.
            </p>
          </div>

          {/* Trust Indicators - Like Shopflo's brand logos */}
          <div className="animate-fade-in-up mt-20">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Trusted by 10,000+ wellness brands
            </p>
            
            {/* Brand/Partner Logos - Shopflo style */}
            <div className="mt-8 flex items-center justify-center gap-8 flex-wrap">
              <div className="trust-logo opacity-60 hover:opacity-100 h-16 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-gray-600">Organic Co.</span>
              </div>
              <div className="trust-logo opacity-60 hover:opacity-100 h-16 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-gray-600">Pure Labs</span>
              </div>
              <div className="trust-logo opacity-60 hover:opacity-100 h-16 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-gray-600">Green Life</span>
              </div>
              <div className="trust-logo opacity-60 hover:opacity-100 h-16 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-gray-600">Wellness+</span>
              </div>
            </div>
          </div>

          {/* Key Stats - Shopflo style metrics */}
          <div className="animate-fade-in-up mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center p-6">
              <div className="text-4xl font-bold metric-number mb-2">+98%</div>
              <div className="text-sm text-gray-600 font-medium">Increase in customer satisfaction for UB Naturals brands</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold metric-number mb-2">+156%</div>
              <div className="text-sm text-gray-600 font-medium">Increase in repeat purchases</div>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl font-bold metric-number mb-2">+67%</div>
              <div className="text-sm text-gray-600 font-medium">Increase in customer lifetime value</div>
            </div>
          </div>

          {/* Additional CTA Section - Shopflo style */}
          <div className="animate-fade-in-up mt-16 bg-green-50 rounded-2xl p-8 border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Go live with us in less than a week!
            </h3>
            <button className="btn-primary bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all">
              Start Your Transformation
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
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl modal-enter overflow-hidden border border-gray-200 
                         md:right-4 md:top-4 md:bottom-4 md:rounded-2xl 
                         sm:rounded-none sm:border-0">
            <div className="flex flex-col h-full">
              {/* Minimal Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                  <span className="hidden sm:inline">Express Checkout</span>
                  <span className="sm:hidden">Checkout</span>
                </h2>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {isOrderSummaryLoading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-2xl border border-green-200">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-700 font-medium text-sm">Updating your order...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto modal-content">
                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Cart Summary - Critical Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span className="hidden sm:inline">Order Summary</span>
                        <span className="sm:hidden">Order</span>
                        <span className="text-xs sm:text-sm font-normal text-gray-500">({(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      </h3>
                      
                      {/* Edit Order Button */}
                      {!isEditingOrder ? (
                        <button 
                          onClick={startEditingOrder}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 transition-all hover:shadow-md"
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
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                          <span className="hidden sm:inline">Modify Order</span>
                          <span className="sm:hidden">Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button 
                            onClick={cancelEditingOrder}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                          <button 
                            onClick={saveOrderChanges}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border-2 transition-all hover:shadow-md"
                            style={{
                              color: 'white',
                              borderColor: 'var(--phthalo-green)',
                              backgroundColor: 'var(--phthalo-green)'
                            }}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span className="hidden sm:inline">Save Changes</span>
                            <span className="sm:hidden">Save</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      {/* Cart Items */}
                      {!isEditingOrder ? (
                        // Regular view
                        cartItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600">{item.size} • Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2 flex-shrink-0">
                              <div>
                                <div className="font-semibold text-gray-900 text-sm sm:text-base">₹{(item.price * item.quantity).toLocaleString()}</div>
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
                          <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600">{item.size}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                  onClick={() => updateTempItemQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isOrderSummaryLoading}
                                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
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
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                  </svg>
                                </button>
                                <span className="w-6 sm:w-8 text-center font-semibold text-gray-800 text-sm sm:text-base">{item.quantity}</span>
                                <button
                                  onClick={() => updateTempItemQuantity(item.id, item.quantity + 1)}
                                  disabled={isOrderSummaryLoading}
                                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 text-gray-600 hover:text-white flex items-center justify-center transition-colors ${
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
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Price and Remove */}
                              <div className="text-right flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm sm:text-base">₹{(item.price * item.quantity).toLocaleString()}</div>
                                  {item.quantity > 1 && (
                                    <div className="text-xs text-gray-500">₹{item.price.toLocaleString()} each</div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeTempItem(item.id)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <span className="hidden sm:inline">Remove</span>
                                  <span className="sm:hidden">×</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Empty cart message during editing */}
                      {isEditingOrder && tempCartItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                          <p className="text-sm">Your cart is empty</p>
                          <p className="text-xs text-gray-400 mt-1">Add some products to continue</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Upsell/Cross-sell Section */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: 'var(--phthalo-green)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span className="hidden sm:inline">Save More with Packs & Combos</span>
                        <span className="sm:hidden">Packs & Combos</span>
                      </h3>
                      {/* Bottle Size Toggle */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
                        <button
                          onClick={() => changeBottleSize('250ml')}
                          disabled={isOrderSummaryLoading}
                          className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded transition-all ${
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
                          className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded transition-all ${
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
                      <div className="flex gap-2 sm:gap-3 min-w-max">
                        {generateUpsells(bottleSize, isEditingOrder ? tempCartItems : cartItems).map((item) => {
                          const isSelected = selectedUpsells.includes(item.id);
                          const isApplied = isUpsellApplied(item.id);
                          // Allow clicking if in edit mode, or if not applied, or if selected (to allow deselection), and not loading
                          const isClickable = (isEditingOrder || !isApplied || isSelected) && !isOrderSummaryLoading;
                          
                          return (
                          <div 
                            key={item.id} 
                            className={`flex-shrink-0 w-36 sm:w-44 border-2 rounded-lg p-2 sm:p-3 transition-all ${
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
                                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1.5 sm:mb-2 py-1 sm:py-2">
                                  {Array.from({ length: (item as any).quantity }).map((_, index) => (
                                    <div key={index} className="w-6 h-6 sm:w-8 sm:h-8 rounded overflow-hidden bg-white border border-gray-200">
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
                                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 py-1 sm:py-2">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded overflow-hidden bg-white border border-gray-200">
                                    <img 
                                      src={(item as any).products[0].image} 
                                      alt={(item as any).products[0].name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-xs sm:text-sm font-bold text-green-600">+</div>
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded overflow-hidden bg-white border border-gray-200">
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
                    <summary className="cursor-pointer flex items-center justify-between p-3 sm:p-4 text-gray-700 hover:text-gray-900 font-medium hover:bg-green-25 transition-colors group">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <img src="/shipping-icon.svg" alt="Shipping" width={16} height={16} className="sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Shipping & Billing Details</span>
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {isShippingDetailsOpen && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Handle edit action here
                            }}
                            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                          >
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                            <span className="hidden sm:inline">Edit Details</span>
                            <span className="sm:hidden">Edit</span>
                          </button>
                        )}
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </summary>
                      
                      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                        {/* Contact Information */}
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-gray-600">Mobile</span>
                            <span className="font-semibold text-gray-900">+91 9999333966</span>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-gray-600">Email</span>
                            <span className="font-semibold text-gray-900 truncate ml-2">puneettest@test.com</span>
                          </div>
                        </div>
                        
                        {/* Billing Address */}
                        <div className="border-t border-green-200 pt-2 sm:pt-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm gap-1 sm:gap-0">
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
                        <div className="border-t border-green-200 pt-2 sm:pt-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs sm:text-sm gap-1 sm:gap-0">
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
                      <div className="space-y-4">
                        
                        
                          <div className="bg-gradient-to-br from-green-50 to-white p-3 sm:p-4 rounded-lg border border-green-200">
                          
                          {/* Your Savings Breakdown */}
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-1.5 sm:gap-2 pb-2 border-b border-green-200">
                              <img src="/dollar-icon.svg" alt="Savings" width={16} height={16} className="sm:w-5 sm:h-5" />
                              <h4 className="font-medium text-gray-800 text-sm sm:text-base">Your Savings Breakdown</h4>
                            </div>
                            
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal ({(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span className="font-semibold text-green-600">₹{pricing.subtotal.toLocaleString()}</span>
                              </div>
                              
                              <div className="space-y-1 border-l-4 border-green-500 pl-2 sm:pl-3 bg-green-25">
                                <div className="flex justify-between text-green-700">
                                  <span className="text-xs sm:text-sm">✓ Base Discount ({pricing.discounts.base}%) - {(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0)} bottle{(isEditingOrder ? tempCartItems : cartItems).reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}</span>
                                  <span className="text-xs sm:text-sm">-₹{Math.round(pricing.subtotal * pricing.discounts.base / 100)}</span>
                                </div>
                                <div className="flex justify-between text-green-700">
                                  <span className="text-xs sm:text-sm">✓ {userState?.isReturning ? 'Loyalty' : 'Welcome'} Discount ({pricing.discounts.loyalty}%)</span>
                                  <span className="text-xs sm:text-sm">-₹{Math.round(pricing.subtotal * pricing.discounts.loyalty / 100)}</span>
                                </div>
                                {appliedCoupon && (
                                  <div className="flex justify-between text-green-700">
                                    <span className="text-xs sm:text-sm">✓ Coupon ({appliedCoupon.code})</span>
                                    <span className="text-xs sm:text-sm">-₹{Math.round(pricing.couponDiscount)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                                <span>Shipping</span>
                                <span className={pricing.shippingFee === 0 ? 'text-green-600 font-semibold' : ''}>
                                  {pricing.shippingFee === 0 ? 'FREE' : `₹${pricing.shippingFee}`}
                                </span>
                              </div>
                              
                              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                                <span>GST (5%)</span>
                                <span>₹{pricing.gst}</span>
                              </div>
                              
                              <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg text-gray-900">
                                <span>Total</span>
                                <span style={{color: 'var(--phthalo-green)'}}>₹{pricing.finalTotal.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Coupon Code Section */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-lg p-3 sm:p-4">
                      
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 pb-2 border-b border-green-200">
                          <img src="/coupon-icon.svg" alt="Coupon" width={16} height={16} className="sm:w-5 sm:h-5" />
                          <h4 className="font-medium text-gray-800 text-sm sm:text-base">Have a Coupon Code?</h4>
                        </div>
                        
                        {!appliedCoupon ? (
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex gap-2 sm:gap-3">
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Enter coupon code"
                                disabled={isOrderSummaryLoading}
                                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm sm:text-base ${
                                  isOrderSummaryLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                onKeyPress={(e) => e.key === 'Enter' && !isOrderSummaryLoading && applyCoupon()}
                              />
                              <button
                                onClick={applyCoupon}
                                disabled={!couponCode.trim() || isOrderSummaryLoading}
                                className="px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
                              <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                {couponError}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-green-800 text-sm sm:text-base">{appliedCoupon.code} Applied!</p>
                                <p className="text-xs sm:text-sm text-green-600">
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
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
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
              <div className="sticky bottom-0" style={{
                background: paymentMethod === 'cod'
                  ? 'linear-gradient(135deg, #7B341E 0%, #B45309 100%)'
                  : 'linear-gradient(135deg, #194D3A 0%, #194D3A 100%)',
                boxShadow: paymentMethod === 'cod'
                  ? '0 -8px 32px rgba(191, 72, 0, 0.25), 0 -4px 16px rgba(191, 72, 0, 0.15)'
                  : '0 -8px 32px rgba(0, 0, 0, 0.15), 0 -4px 16px rgba(0, 0, 0, 0.1)'
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
                      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/20">
                        <div className="flex items-center gap-2 sm:gap-4">
                          {/* Payment Method Buttons */}
                          <div className="flex gap-2 sm:gap-3 flex-1">
                            <button
                              onClick={() => setPaymentMethod('razorpay')}
                              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-all ${
                                paymentMethod === 'razorpay'
                                  ? 'border-white bg-white text-green-700 shadow-lg'
                                  : 'border-white/30 text-white hover:border-white/60 hover:bg-white/10'
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${
                                paymentMethod === 'razorpay' ? 'border-green-500 bg-green-500' : 'border-white/60'
                              }`}></div>
                              <span className="font-semibold text-xs sm:text-sm">Razorpay</span>
                              {paymentMethod === 'razorpay' && (
                                <span className="bg-green-600 text-white px-1 sm:px-2 py-0.5 text-xs font-bold rounded hidden sm:inline">RECOMMENDED</span>
                              )}
                            </button>
                            
                            <button
                              onClick={() => setPaymentMethod('cod')}
                              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border-2 transition-all ${
                                paymentMethod === 'cod'
                                  ? 'border-orange-300 bg-orange-100 text-orange-800 shadow-lg'
                                  : 'border-white/30 text-white hover:border-white/60 hover:bg-white/10'
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 ${
                                paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500' : 'border-white/60'
                              }`}></div>
                              <span className="font-semibold text-xs sm:text-sm">
                                <span className="hidden sm:inline">Cash on Delivery</span>
                                <span className="sm:hidden">COD</span>
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Optimized Messaging for Selected Method */}
                        <div className="mt-3 sm:mt-4">
                          {paymentMethod === 'razorpay' ? (
                            <div className="flex items-start gap-3 sm:gap-4 rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 shadow-[0_16px_40px_rgba(0,0,0,0.25)] bg-gradient-to-r from-white/95 via-green-50/90 to-white/95 border-green-300 text-green-900">
                              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm uppercase tracking-wide font-semibold text-green-800/80">
                                  Save ₹{Math.round(totalSavings)} + Free Shipping
                                </p>
                                <p className="mt-1 text-sm sm:text-base font-semibold leading-relaxed">
                                  <span className="hidden sm:inline">Great choice! You save ₹{Math.round(totalSavings)}</span>
                                  <span className="sm:hidden">Save ₹{Math.round(totalSavings)} • FREE shipping • Max discounts</span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 sm:gap-4 rounded-xl border-2 px-3 sm:px-4 py-3 sm:py-4 shadow-[0_16px_40px_rgba(0,0,0,0.25)] bg-gradient-to-r from-white/95 via-orange-50/90 to-white/95 border-orange-300 text-orange-900">
                              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm uppercase tracking-wide font-semibold text-orange-800/80">
                                  ₹99 COD Fee + ₹{Math.round(totalSavings)} Extra
                                </p>
                                <p className="mt-1 text-sm sm:text-base font-semibold leading-relaxed">
                                  <span className="hidden sm:inline">Switch to Razorpay to save!</span>
                                  <span className="sm:hidden">₹{Math.round(totalSavings)} extra • ₹99 shipping • Switch to save!</span>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Dynamic Payment Button */}
                <div className="p-3 sm:p-6 pb-3 sm:pb-4 bg-white/5 backdrop-blur-sm">
                  {(() => {
                    const pricing = calculatePricing();
                    return (
                      <div className="space-y-2 sm:space-y-3">
                        <button 
                          className="w-full text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all shadow-2xl relative overflow-hidden border-2 border-white/20 hover:border-white/40 hover:shadow-3xl transform hover:scale-[1.02]"
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                            color: 'var(--phthalo-green)'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 to-transparent -translate-x-full animate-shimmer"></div>
                          <div className="relative flex items-center justify-center gap-2 sm:gap-3">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623A11.99 11.99 0 0 0 20.402 6 11.959 11.959 0 0 1 12 2.713Z" />
                            </svg>
                            <span>Pay ₹{pricing.finalTotal.toLocaleString()} Securely</span>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{backgroundColor: 'var(--phthalo-green)'}}></div>
                          </div>
                        </button>
                        <p className="text-center text-xs text-white/70">
                          Your payment information is encrypted and never stored
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Security Trust Indicators - Bottom of Sticky Bar */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white/10 backdrop-blur-sm border-t border-white/20">
                  <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs">
                    <div className="flex items-center gap-1 sm:gap-2 text-white/80">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623A11.99 11.99 0 0 0 20.402 6 11.959 11.959 0 0 1 12 2.713Z" />
                      </svg>
                      <span className="font-medium text-xs">
                        <span className="hidden sm:inline">256-bit SSL</span>
                        <span className="sm:hidden">SSL</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-white/80">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      <span className="font-medium text-xs">
                        <span className="hidden sm:inline">Bank-level Security</span>
                        <span className="sm:hidden">Secure</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-white/80">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
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
