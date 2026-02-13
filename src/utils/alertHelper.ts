import { Alert, Platform } from 'react-native';

/**
 * Muestra una alerta simple y permite ejecutar algo al dar OK.
 */
export const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
        // En web: window.alert detiene el código.
        window.alert(`${title}\n\n${message}`);

        // Si nos han pasado una función (ej: router.back), la ejecutamos
        if (onOk) {
            onOk();
        }
    } else {
        // En móvil: Pasamos la función al botón "OK"
        Alert.alert(title, message, [
            {
                text: 'OK',
                onPress: onOk
            }
        ]);
    }
};

/**
 * Muestra una confirmación (Botones Cancelar / Aceptar)
 */
export const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result) {
            onConfirm();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Aceptar",
                    onPress: onConfirm
                }
            ]
        );
    }
};
