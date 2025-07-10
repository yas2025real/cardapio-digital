import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage, auth } from '../firebase';

function Cardapio() {
    const { restaurantId } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [cart, setCart] = useState([]);
    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('Dinheiro');
    const [change, setChange] = useState('');
    const [notes, setNotes] = useState('');
    const [user, setUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        db.collection('restaurants').doc(restaurantId).get().then(doc => {
            if (doc.exists) {
                setRestaurant(doc.data());
            } else {
                alert('Cardápio não encontrado');
            }
        });

        auth.onAuthStateChanged(user => {
            setUser(user);
        });
    }, [restaurantId]);

    const addToCart = item => {
        setCart([...cart, { ...item, quantity: 1 }]);
    };

    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        newCart[index].quantity += delta;
        if (newCart[index].quantity <= 0) {
            newCart.splice(index, 1);
        }
        setCart(newCart);
    };

    const sendOrder = () => {
        if (!address) {
            alert('Por favor, preencha o endereço.');
            return;
        }
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orderMessage = `
*Novo Pedido*
*Itens:*
${cart.map(item => `- ${item.quantity}x ${item.name} - R$${(item.price * item.quantity).toFixed(2)}`).join('\n')}
*Observações:* ${notes || 'Nenhuma'}
*Total:* R$${total.toFixed(2)}
*Endereço:* ${address}
*Forma de Pagamento:* ${payment}${payment === 'Dinheiro' && change ? ` (Troco para R$${change})` : ''}
        `.trim();
        const encodedMessage = encodeURIComponent(orderMessage);
        const whatsappUrl = `https://wa.me/${restaurant.restaurant.whatsapp}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleEdit = () => {
        window.location.href = `/configurar?token=${restaurant.restaurant.customLink}`;
    };

    if (!restaurant) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="relative">
                {user && (
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-2xl p-2"
                        >
                            ⋮
                        </button>
                        {showMenu && (
                            <div className="bg-white shadow-lg rounded p-2">
                                <button
                                    onClick={handleEdit}
                                    className="block w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Editar Cardápio
                                </button>
                                <button
                                    onClick={() => auth.signOut()}
                                    className="block w-full text-left p-2 hover:bg-gray-100"
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <div className="text-center mb-4">
                    <img src={restaurant.restaurant.logo} alt="Logo" className="w-24 h-24 mx-auto rounded-full" />
                    <h1 className="text-3xl font-bold">{restaurant.restaurant.name}</h1>
                    <p>{restaurant.restaurant.address}</p>
                    <p>{restaurant.restaurant.hours}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {restaurant.items.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow">
                            <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded" />
                            <h2 className="text-xl font-bold">{item.name}</h2>
                            <p>{item.description}</p>
                            <p className="text-lg font-semibold">R${item.price}</p>
                            <button
                                onClick={() => addToCart(item)}
                                className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600"
                            >
                                Adicionar ao Carrinho
                            </button>
                        </div>
                    ))}
                </div>
                {cart.length > 0 && (
                    <div className="mt-8 bg-white p-4 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-4">Carrinho</h2>
                        {cart.map((item, index) => (
                            <div key={index} className="flex justify-between mb-2">
                                <span>{item.quantity}x {item.name}</span>
                                <div>
                                    <button
                                        onClick={() => updateQuantity(index, -1)}
                                        className="bg-red-500 text-white p-1 rounded mr-2"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={() => updateQuantity(index, 1)}
                                        className="bg-green-500 text-white p-1 rounded"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Endereço de Entrega"
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Observações"
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <select
                            value={payment}
                            onChange={e => setPayment(e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                        >
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Cartão">Cartão</option>
                            <option value="Pix">Pix</option>
                        </select>
                        {payment === 'Dinheiro' && (
                            <input
                                type="text"
                                value={change}
                                onChange={e => setChange(e.target.value)}
                                placeholder="Troco para quanto?"
                                className="w-full p-2 mb-4 border rounded"
                            />
                        )}
                        <button
                            onClick={sendOrder}
                            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                            disabled={!address}
                        >
                            Enviar Pedido via WhatsApp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cardapio;