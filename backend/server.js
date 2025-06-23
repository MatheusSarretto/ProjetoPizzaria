
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

const JWT_SECRET = process.env.JWT_SECRET || 'um_segredo_muito_secreto_e_longo_para_jwt'; 
if (process.env.NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
    console.warn('AVISO: JWT_SECRET não definido nas variáveis de ambiente. Usando segredo padrão.');
}

let pool;
async function initializeDatabasePool() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Conexão com o banco de dados MySQL estabelecida!');
        await pool.getConnection();
        console.log('Teste de conexão bem-sucedido!');
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error.message);
        process.exit(1); 
    }
}

initializeDatabasePool();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro de verificação do token:', err);
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user; 
        next(); 
    });
};


const authorizeRoles = (...roles) => { 
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
        }
        next();
    };
};

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, cpf, cellphone } = req.body;

    if (!name || !email || !password || !cpf || !cellphone) {
        return res.status(400).json({ message: 'Todos os campos (Nome, Email, Senha, CPF, Celular) são obrigatórios.' });
    }

    try {
        const [existingUsers] = await pool.query(
            'SELECT id, email, cpf FROM users WHERE email = ? OR cpf = ?',
            [email, cpf]
        );

        if (existingUsers.length > 0) {
            if (existingUsers.some(u => u.email === email)) {
                return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
            }
            if (existingUsers.some(u => u.cpf === cpf)) {
                return res.status(409).json({ message: 'Este CPF já está cadastrado.' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, cpf, cellphone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, cpf, cellphone]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.insertId });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const [users] = await pool.query('SELECT id, name, email, password, role, cpf, cellphone FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, cpf: user.cpf, cellphone: user.cellphone },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login bem-sucedido!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, cpf: user.cpf, cellphone: user.cellphone }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY category, name');
        const productsWithParsedPrice = rows.map(product => ({ ...product, price: parseFloat(product.price) }));
        res.json(productsWithParsedPrice);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos.' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.json({ ...rows[0], price: parseFloat(rows[0].price) });
    } catch (error) {
        console.error(`Erro ao buscar produto com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao buscar produto.' });
    }
});

app.post('/api/products', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { name, description, price, category } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ message: 'Nome, preço e categoria são obrigatórios.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO products (name, description, price, category) VALUES (?, ?, ?, ?)',
            [name, description, price, category]
        );
        res.status(201).json({ id: result.insertId, message: 'Produto adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ message: 'Erro ao adicionar produto.' });
    }
});

app.put('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;
    if (!name || !price || !category) {
        return res.status(400).json({ message: 'Nome, preço e categoria são obrigatórios.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE products SET name = ?, description = ?, price = ?, category = ? WHERE id = ?',
            [name, description, price, category, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para atualização.' });
        }
        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar produto com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao atualizar produto.' });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado para exclusão.' });
        }
        res.json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir produto com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao excluir produto.' });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    if (req.user.id != id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para editar este perfil.' });
    }

    const { name, email, cellphone, password } = req.body;
    let query = 'UPDATE users SET name = ?, email = ?, cellphone = ?';
    let params = [name, email, cellphone];

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        query += ', password = ?';
        params.push(hashedPassword);
    }
    query += ' WHERE id = ?';
    params.push(id);

    try {
        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const [updatedUsers] = await pool.query('SELECT id, name, email, role, cpf, cellphone FROM users WHERE id = ?', [id]);
        const updatedUser = updatedUsers[0];

        const newToken = jwt.sign(
            { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, cpf: updatedUser.cpf, cellphone: updatedUser.cellphone },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ message: 'Perfil atualizado com sucesso!', token: newToken, user: updatedUser });

    } catch (error) {
        console.error(`Erro ao atualizar usuário com ID ${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('email')) {
                return res.status(409).json({ message: 'Este email já está sendo usado por outro usuário.' });
            }
            if (error.sqlMessage.includes('cpf')) {
                return res.status(409).json({ message: 'Este CPF já está sendo usado por outro usuário.' });
            }
        }
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});

app.get('/api/addresses/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [userId]);
        res.json(addresses);
    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        res.status(500).json({ message: 'Erro ao buscar endereços.' });
    }
});

app.post('/api/addresses', async (req, res) => { 
    const { user_id, nickname, street, number, complement, neighborhood, city, state, zip_code } = req.body;

    if (!user_id || !nickname || !street || !number || !neighborhood || !city || !state || !zip_code) {
        return res.status(400).json({ message: 'Campos obrigatórios do endereço faltando.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO addresses (user_id, nickname, street, number, complement, neighborhood, city, state, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, nickname, street, number, complement, neighborhood, city, state, zip_code]
        );
        res.status(201).json({ id: result.insertId, message: 'Endereço adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.status(500).json({ message: 'Erro ao adicionar endereço.' });
    }
});

app.put('/api/addresses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { user_id, nickname, street, number, complement, neighborhood, city, state, zip_code } = req.body;
    try {
        const [address] = await pool.query('SELECT user_id FROM addresses WHERE id = ?', [id]);
        if (address.length === 0) return res.status(404).json({ message: 'Endereço não encontrado.' });
        if (address[0].user_id != req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado: Você não pode editar este endereço.' });
        }
        if (!nickname || !street || !number || !neighborhood || !city || !state || !zip_code) {
            return res.status(400).json({ message: 'Campos obrigatórios do endereço faltando.' });
        }
        const [result] = await pool.query(
            'UPDATE addresses SET nickname = ?, street = ?, number = ?, complement = ?, neighborhood = ?, city = ?, state = ?, zip_code = ? WHERE id = ?',
            [nickname, street, number, complement, neighborhood, city, state, zip_code, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Endereço não encontrado para atualização.' });
        res.json({ message: 'Endereço atualizado com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atualizar endereço com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao atualizar endereço.' });
    }
});

app.delete('/api/addresses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [address] = await pool.query('SELECT user_id FROM addresses WHERE id = ?', [id]);
        if (address.length === 0) return res.status(404).json({ message: 'Endereço não encontrado.' });
        if (address[0].user_id != req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado: Você não pode excluir este endereço.' });
        }
        const [result] = await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Endereço não encontrado para exclusão.' });
        res.json({ message: 'Endereço excluído com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir endereço com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao excluir endereço.' });
    }
});

app.get('/api/cards/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const [cards] = await pool.query('SELECT id, user_id, nickname, last_four_digits, brand, cardholder_name FROM cards WHERE user_id = ?', [userId]);
        res.json(cards);
    } catch (error) {
        console.error('Erro ao buscar cartões:', error);
        res.status(500).json({ message: 'Erro ao buscar cartões.' });
    }
});

app.post('/api/cards', async (req, res) => {
    const { user_id, nickname, last_four_digits, brand, cardholder_name, gateway_token } = req.body;
    if (!user_id || !last_four_digits || !brand || !cardholder_name || !gateway_token) {
        return res.status(400).json({ message: 'Campos obrigatórios do cartão faltando.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO cards (user_id, nickname, last_four_digits, brand, cardholder_name, gateway_token) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, nickname, last_four_digits, brand, cardholder_name, gateway_token]
        );
        res.status(201).json({ id: result.insertId, message: 'Cartão adicionado com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar cartão:', error);
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Este cartão (token) já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao adicionar cartão.' });
    }
});

app.delete('/api/cards/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [card] = await pool.query('SELECT user_id FROM cards WHERE id = ?', [id]);
        if (card.length === 0) return res.status(404).json({ message: 'Cartão não encontrado.' });
        if (card[0].user_id != req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado: Você não pode excluir este cartão.' });
        }
        const [result] = await pool.query('DELETE FROM cards WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Cartão não encontrado para exclusão.' });
        res.json({ message: 'Cartão excluído com sucesso!' });
    } catch (error) {
        console.error(`Erro ao excluir cartão com ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao excluir cartão.' });
    }
});

app.get('/api/coupons', authenticateToken, async (req, res) => {
    try {
        const [generalCoupons] = await pool.query('SELECT id, code, description, type, value, target_item_category, max_uses, expires_at FROM coupons WHERE is_active = TRUE AND purchases_required IS NULL');
        
        let loyaltyProgress = null;
        if (req.user && req.user.id) {
            const [loyaltyRows] = await pool.query('SELECT * FROM customer_loyalty WHERE user_id = ?', [req.user.id]);
            if (loyaltyRows.length > 0) {
                loyaltyProgress = loyaltyRows[0];
            }
        }

        const availableCoupons = generalCoupons.map(coupon => ({
            ...coupon,
            value: parseFloat(coupon.value),
        }));

        if (loyaltyProgress) {
            const [fidelidade30Coupon] = await pool.query("SELECT id, code, description, type, value FROM coupons WHERE code = 'FIDELIDADE30'");
            if (loyaltyProgress.fidelidade30_available && fidelidade30Coupon.length > 0) {
                availableCoupons.push({ ...fidelidade30Coupon[0], value: parseFloat(fidelidade30Coupon[0].value) });
            }
            const [brotoGratisCoupon] = await pool.query("SELECT id, code, description, type, value FROM coupons WHERE code = 'BROTOGRATIS'");
            if (loyaltyProgress.brotogratis_available && brotoGratisCoupon.length > 0) {
                availableCoupons.push({ ...brotogratisCoupon[0], value: parseFloat(brotogratisCoupon[0].value) });
            }
        }
        
        res.json(availableCoupons);
    } catch (error) {
        console.error('Erro ao buscar cupons:', error);
        res.status(500).json({ message: 'Erro ao buscar cupons.' });
    }
});

app.post('/api/coupons/apply', authenticateToken, async (req, res) => {
    const { couponCode, currentTotalPrice, cartItems } = req.body;
    const userId = req.user.id;

    if (!couponCode || currentTotalPrice === undefined || !cartItems) {
        return res.status(400).json({ message: 'Dados incompletos para aplicar cupom.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [coupons] = await connection.query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [couponCode]);
        if (coupons.length === 0) {
            return res.status(404).json({ message: 'Cupom inválido ou inativo.' });
        }
        const coupon = coupons[0];

        let newTotalPrice = currentTotalPrice;
        let discountAmount = 0;
        let message = '';
        
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Cupom expirado.' });
        }
        if (coupon.max_uses !== null) {
        }

        if (coupon.purchases_required) {
            const [loyaltyRows] = await connection.query('SELECT * FROM customer_loyalty WHERE user_id = ?', [userId]);
            const loyaltyProgress = loyaltyRows[0];

            if (!loyaltyProgress || (coupon.code === 'FIDELIDADE30' && !loyaltyProgress.fidelidade30_available) || (coupon.code === 'BROTOGRATIS' && !loyaltyProgress.brotogratis_available)) {
                return res.status(403).json({ message: 'Cupom de fidelidade não disponível ou já utilizado.' });
            }
        }

        if (coupon.type === 'percentage') {
            discountAmount = currentTotalPrice * (parseFloat(coupon.value) / 100);
            newTotalPrice = currentTotalPrice - discountAmount;
            message = `${parseFloat(coupon.value)}% de desconto aplicado!`;
        } else if (coupon.type === 'free_item' && coupon.target_item_category === 'broto') {
            const brotoItem = cartItems.find(item => item.item_size === 'broto');
            if (brotoItem) {
                discountAmount = brotoItem.item_price;
                newTotalPrice = currentTotalPrice - discountAmount;
                message = 'Pizza broto grátis aplicada!';
            } else {
                return res.status(400).json({ message: 'Cupom BROTOGRATIS exige uma pizza broto no carrinho.' });
            }
        } else if (coupon.type === 'fixed') {
             discountAmount = parseFloat(coupon.value);
             newTotalPrice = currentTotalPrice - discountAmount;
             message = `R$ ${parseFloat(coupon.value).toFixed(2)} de desconto aplicado!`;
        }
        
        if (newTotalPrice < 0) newTotalPrice = 0;

        res.json({ newTotalPrice: newTotalPrice, discountAmount: discountAmount, message: message });

    } catch (error) {
        console.error('Erro ao aplicar cupom:', error);
        res.status(500).json({ message: 'Erro ao aplicar cupom.', detail: error.sqlMessage || error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/loyalty/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const [loyalty] = await pool.query('SELECT * FROM customer_loyalty WHERE user_id = ?', [userId]);
        if (loyalty.length === 0) {
            await pool.query('INSERT INTO customer_loyalty (user_id) VALUES (?)', [userId]);
            return res.json({ user_id: userId, purchases_count: 0, fidelidade30_available: false, brotogratis_available: false });
        }
        res.json(loyalty[0]);
    } catch (error) {
        console.error('Erro ao buscar progresso de fidelidade:', error);
        res.status(500).json({ message: 'Erro ao buscar progresso de fidelidade.' });
    }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
    const { addressId, totalPrice, paymentMethod, notes, items, cupomApplied, discountAmount } = req.body; 
    const userId = req.user.id;

    if (!userId || !addressId || !totalPrice === undefined || !paymentMethod || !items || items.length === 0) {
        return res.status(400).json({ message: 'Dados do pedido incompletos.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, address_id, total_price, payment_method, notes) VALUES (?, ?, ?, ?, ?)',
            [userId, addressId, totalPrice, paymentMethod, notes || null]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            const productId = item.productId;
            const itemPrice = item.item_price;
            const quantity = item.quantity;
            
            const itemFlavors = item.item_flavors || null;
            const itemSize = item.item_size || null;
            const itemBorderFlavor = item.item_border_flavor || null;
            const itemObservations = item.item_observations || null;
            
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, item_price, quantity, item_flavors, item_size, item_border_flavor, item_observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    orderId,
                    productId,
                    itemPrice,
                    quantity,
                    itemFlavors,
                    itemSize,
                    itemBorderFlavor,
                    itemObservations
                ]
            );
        }

        await connection.query('INSERT INTO customer_loyalty (user_id, purchases_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE purchases_count = purchases_count + 1', [userId]);
        
        const [loyaltyRowsAfterUpdate] = await connection.query('SELECT * FROM customer_loyalty WHERE user_id = ?', [userId]);
        let loyaltyProgress = loyaltyRowsAfterUpdate[0];

        if (loyaltyProgress.purchases_count >= 5 && !loyaltyProgress.fidelidade30_available) {
            await connection.query('UPDATE customer_loyalty SET fidelidade30_available = TRUE WHERE user_id = ?', [userId]);
            loyaltyProgress.fidelidade30_available = true;
        }
        if (loyaltyProgress.purchases_count >= 10 && !loyaltyProgress.brotogratis_available) {
            await connection.query('UPDATE customer_loyalty SET brotogratis_available = TRUE WHERE user_id = ?', [userId]);
            loyaltyProgress.brotogratis_available = true;
        }

        if (cupomApplied) {
            const [couponDetails] = await connection.query('SELECT code, purchases_required FROM coupons WHERE code = ?', [cupomApplied]);
            if (couponDetails.length > 0 && couponDetails[0].purchases_required) { 
                if (couponDetails[0].code === 'FIDELIDADE30' && loyaltyProgress.fidelidade30_available) {
                    await connection.query('UPDATE customer_loyalty SET fidelidade30_available = FALSE, purchases_count = 0 WHERE user_id = ?', [userId]);
                } else if (couponDetails[0].code === 'BROTOGRATIS' && loyaltyProgress.brotogratis_available) {
                    await connection.query('UPDATE customer_loyalty SET brotogratis_available = FALSE, purchases_count = 0 WHERE user_id = ?', [userId]);
                }
            }
        }
        
        await connection.commit();
        res.status(201).json({ message: 'Pedido realizado com sucesso!', orderId: orderId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erro ao finalizar pedido:', error);
        res.status(500).json({ message: 'Erro ao finalizar pedido.', detail: error.sqlMessage || error.message });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/orders/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        console.log(`Backend: Fetching orders for user ID: ${userId}`);
        const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        console.log('Backend: Orders found:', orders);

        for (let order of orders) {
            console.log(`Backend: Fetching items for Order ID: ${order.id}`);
            const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            
            order.items = items.map(item => ({
                ...item,
                item_flavors: item.item_flavors || '', 
                item_price: parseFloat(item.item_price)
            }));
            order.total_price = parseFloat(order.total_price);
            console.log('Backend: Processed order with items:', order);
        }

        res.json(orders);
    } catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
        res.status(500).json({ message: 'Erro ao buscar histórico de pedidos.', detail: error.sqlMessage || error.message });
    } finally {
        if (connection) connection.release(); 
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});