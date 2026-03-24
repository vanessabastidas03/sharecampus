import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import database from '@react-native-firebase/database';

export default function App() {
  const [mensaje, setMensaje] = useState('Conectando...');

  useEffect(() => {
    const ref = database().ref('/test');

    ref.set({ mensaje: 'Firebase conectado ✅', timestamp: Date.now() })
      .then(() => console.log('Escrito en Firebase'))
      .catch(err => console.error('Error escribiendo:', err));

    ref.on('value', snapshot => {
      const data = snapshot.val();
      if (data) setMensaje(data.mensaje);
    });

    return () => ref.off('value');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  texto: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});