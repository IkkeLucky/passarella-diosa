// Load environment variables
require('dotenv').config();

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Debug environment variables (don't log full keys in production!)
console.log('Environment Check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
console.log('- STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Present' : 'Missing');
console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Present' : 'Missing');
console.log('- PORT:', process.env.PORT || '3000 (default)');

// Middleware
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        console.log('Received checkout request:', req.body);
        
        if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            throw new Error('No items provided');
        }

        const lineItems = req.body.items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: [item.image],
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity || 1,
        }));

        console.log('Creating Stripe session with line items:', lineItems);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success.html`,
            cancel_url: `${req.protocol}://${req.get('host')}/shop.html`,
            shipping_address_collection: {
                allowed_countries: ['ES', 'DE'], // Spain and Germany
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 500, // €5.00
                            currency: 'eur',
                        },
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 5,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 7,
                            },
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 1000, // €10.00
                            currency: 'eur',
                        },
                        display_name: 'Express Shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 1,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 2,
                            },
                        },
                    },
                },
            ],
        });

        console.log('Stripe session created:', session.id);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Webhook endpoint to handle successful payments
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle successful payments
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('Payment successful for session:', session.id);
            
            // Here you would typically:
            // 1. Fulfill the order
            // 2. Send confirmation email
            // 3. Update inventory
            // For now, we'll just log it
            console.log('Customer details:', {
                email: session.customer_details.email,
                name: session.customer_details.name,
                shipping: session.shipping_details
            });
        }

        res.json({received: true});
    } catch (err) {
        console.error('Webhook Error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Stripe configuration status: ${process.env.STRIPE_SECRET_KEY ? 'OK' : 'Missing'}`);
}); 