// Pila de capas que atrapan el foco (modal, detail-modal, form-modal, confirm-dialog). Cada capa se apunta al abrirse y se quita al cerrarse; con Esc solo reacciona la de arriba
// (la última abierta), así un diálogo de confirmación abierto sobre un panel se cierra solo y el panel sigue ahí hasta el siguiente Esc.
const stack: object[] = [];

// Apunta la capa y devuelve la función que la quita (llamarla dos veces no hace nada).
export function pushOverlay(token: object): () => void {
  stack.push(token);
  return () => {
    const i = stack.indexOf(token);
    if (i >= 0) stack.splice(i, 1);
  };
}

export function isTopOverlay(token: object): boolean {
  return stack.length > 0 && stack[stack.length - 1] === token;
}

// Esc para una capa: ignora el evento si otro ya lo atendió o si no es la de arriba; si lo atiende, lo consume para que nadie más lo use.
export function takeEscape(token: object, event: Event): boolean {
  if (event.defaultPrevented || !isTopOverlay(token)) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}
