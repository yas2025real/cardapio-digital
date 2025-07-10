import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, storage, auth } from '../firebase';

function Configurar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(true);
    const [restaurant, setRestaurant] = useState({
        name: '',
        logo: null,
        address: '',
        hours: '',
        whatsapp: '',
        customLink: '',
        items: []
    });
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenParam = urlParams.get('token');
        setToken(tokenParam);

        if (tokenParam) {
            db.collection('tokens').doc(tokenParam).get().then(doc => {
                if (doc.exists && doc.data().valid) {
                    setLoading(false);
                } else {
                    setError('Token inválido ou expirado');
                    setLoading(false);
                }
            });
        } else {
            setError('Token não fornecido');
            setLoading(false);
        }

        auth.onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                db.collection('users').doc(user.email).get().then(doc => {
                    if (doc.exists) {
                        const restaurantId = doc.data().restaurantId;
                        db.collection('restaurants').doc(restaurantId).get().then(rDoc => {
                            if (rDoc.exists) {
                                setRestaurant(rDoc.data());
                                setIsEditing(true);
                            }
                        });
                    }
                });
            }
        });
    }, []);

    const handleAuth = async () => {
        try {
            if (isSignUp) {
                await auth.createUserWithEmailAndPassword(email, password);
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleWhatsAppLogin = () => {
        alert('Funcionalidade de login via WhatsApp em desenvolvimento.');
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!user || !token) return;

        try {
            let logoUrl = '';
            if (restaurant.logo) {
                const storageRef = storage.ref(`restaurants/${user.email}/${restaurant.logo.name}`);
                await storageRef.put(restaurant.logo);
                logoUrl = await storageRef.getDownloadURL();
            }

            let restaurantId = restaurant.customLink;
            const existingDoc = await db.collection('restaurants').doc(restaurantId).get();
            if (existingDoc.exists) {
                let counter = 1;
                while (true) {
                    restaurantId = `${restaurant.customLink}-${counter}`;
                    const checkDoc = await db.collection('restaurants').doc(restaurantId).get();
                    if (!checkDoc.exists) break;
                    counter++;
                }
            }

            const restaurantData = {
                restaurant: {
                    name: restaurant.name,
                    logo: logoUrl,
                    address: restaurant.address,
                    hours: restaurant.hours,
                    whatsapp: restaurant.whatsapp,
                    customLink: restaurantId
                },
                items: restaurant.items
            };

            await db.collection('restaurants').doc(restaurantId).set(restaurantData);
            await db.collection('users').doc(user.email).set({ restaurantId });
            await db.collection('tokens').doc(token).delete();
            alert(`Cardápio salvo! Acesse em ${window.location.origin}/${restaurantId}`);
            navigate(`/${restaurantId}`);
        } catch (err) {
            setError(err.message);
        }
    };

    const addItem = () => {
        setRestaurant({
            ...restaurant,
            items: [...restaurant.items, { name: '', price: '', description: '', image: null }]
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...restaurant.items];
        newItems[index][field] = value;
        setRestaurant({ ...restaurant, items: newItems });
    };

    const handleItemImage = (index, file) => {
        const newItems = [...restaurant.items];
        newItems[index].image = file;
        setRestaurant({ ...restaurant, items: newItems });
    };

    if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;
    if (error) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                {!user ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{isSignUp ? 'Criar Conta' : 'Entrar'}</h2>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="E-mail"
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Senha"
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <button
                            onClick={handleAuth}
                            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        >
                            {isSignUp ? 'Criar Conta' : 'Entrar'}
                        </button>
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="w-full text-blue-500 mt-2"
                        >
                            {isSignUp ? 'Já tem conta? Entrar' : 'Criar nova conta'}
                        </button>
                        <button
                            onClick={handleWhatsAppLogin}
                            className="w-full bg-green-500 text-white p-2 rounded mt-2 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            Entrar com WhatsApp (Em Desenvolvimento)
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-2xl font-bold mb-4">
                            {isEditing ? 'Editar Cardápio' : 'Configurar Cardápio'}
                        </h2>
                        <input
                            type="text"
                            value={restaurant.name}
                            onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                            placeholder="Nome do Restaurante"
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <input
                            type="file"
                            onChange={e => setRestaurant({ ...restaurant, logo: e.target.files[0] })}
                            className="w-full p-2 mb-4"
                        />
                        <input
                            type="text"
                            value={restaurant.address}
                            onChange={e => setRestaurant({ ...restaurant, address: e.target.value })}
                            placeholder="Endereço"
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <input
                            type="text"
                            value={restaurant.hours}
                            onChange={e => setRestaurant({ ...restaurant, hours: e.target.value })}
                            placeholder="Horário de Funcionamento"
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <input
                            type="text"
                            value={restaurant.whatsapp}
                            onChange={e => setRestaurant({ ...restaurant, whatsapp: e.target.value })}
                            placeholder="WhatsApp (ex.: +5511999999999)"
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <input
                            type="text"
                            value={restaurant.customLink}
                            onChange={e => setRestaurant({ ...restaurant, customLink: e.target.value })}
                            placeholder="Link Personalizado (ex.: pizza-do-joao)"
                            className="w-full p-2 mb-4 border rounded"
                            required
                            disabled={isEditing}
                        />
                        <h3 className="text-xl font-bold mb-2">Itens do Cardápio</h3>
                        {restaurant.items.map((item, index) => (
                            <div key={index} className="mb-4 p-4 border rounded">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={e => updateItem(index, 'name', e.target.value)}
                                    placeholder="Nome do Item"
                                    className="w-full p-2 mb-2 border rounded"
                                    required
                                />
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={e => updateItem(index, 'price', e.target.value)}
                                    placeholder="Preço"
                                    className="w-full p-2 mb-2 border rounded"
                                    required
                                />
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                    placeholder="Descrição"
                                    className="w-full p-2 mb-2 border rounded"
                                />
                                <input
                                    type="file"
                                    onChange={e => handleItemImage(index, e.target.files[0])}
                                    className="w-full p-2 mb-2"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full bg-green-500 text-white p-2 rounded mb-4 hover:bg-green-600"
                        >
                            Adicionar Item
                        </button>
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        >
                            Salvar Cardápio
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Configurar;