# NEXU Test Case Guide (from nexu.md)

## Servers Running
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Test Case Steps

### Usuario A (First Browser/Window)
1. Go to http://localhost:3000
2. Click "Registrarse"
3. Register with:
   - Email: `usuarioA@test.com`
   - Password: `password123`
   - Name: `Juan`
   - Area: `INGENIERIA`
4. After login, navigate to `/grupos`
5. Click "Crear Grupo"
6. Create group:
   - Name: `Estudio de Programación`
   - Description: `Grupo para estudiar programación`
   - Area: `INGENIERIA`
7. Click "Crear" - should see success message
8. Navigate to `/salas`
9. Click "Crear Sala"
10. Create room:
    - Name: `Clase en vivo`
    - Area: `INGENIERIA`
11. Click "Crear" - should enter AudioRoom
12. Verify connection status shows "🟢 Conectado"

### Usuario B (Incognito/Different Browser)
1. Go to http://localhost:3000 (new incognito window)
2. Click "Registrarse"
3. Register with:
   - Email: `usuarioB@test.com`
   - Password: `password456`
   - Name: `María`
   - Area: `CIENCIAS_SOCIALES`
4. After login, navigate to `/explorar`
5. Search for "Juan" in search box
6. Click "Seguir" button
   - Should see: "Ahora estás siguiendo a este usuario"
7. Search for "Estudio de Programación"
8. Click "Unirse" button on group
   - Should see: "Te has unido al grupo correctamente"
9. Look at active rooms (should see "Clase en vivo")
10. Click "Unirse" on the room
11. Should enter AudioRoom with User A
12. Both users should see each other in the users list
    - User A should see "Usuario B..." in the list
    - User B should see "Usuario A..." in the list

## Verification Checklist

✅ User registration works
✅ User login works
✅ Create group works
✅ Create room works
✅ Follow user works
✅ Join group works
✅ Join room works (AudioRoom loads)
✅ Real-time updates show new groups/rooms
✅ Error messages display correctly
✅ Socket.io connection established

## Notes

- WebRTC audio may require microphone permissions
- Both users should have audio enabled to test audio functionality
- If audio doesn't work, check browser console for errors
- All buttons should provide feedback (success/error messages via alerts)
