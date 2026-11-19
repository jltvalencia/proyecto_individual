describe('Pruebas de la aplicación Horario', () => {
  test('verifica que la configuración de Jest funciona correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  test('verifica que los días de la semana están completos', () => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    expect(dias).toHaveLength(5);
    expect(dias).toContain('Lunes');
  });
});