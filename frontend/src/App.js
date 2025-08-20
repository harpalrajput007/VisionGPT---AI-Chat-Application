import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ColorModeContext } from './context/ColorModeContext';

function App() {
  const [mode, setMode] = React.useState('dark'); // default dark

  const colorMode = React.useMemo(() => ({
    mode,
    toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }), [mode]);

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark'
        ? {
            background: { default: '#202123', paper: '#26262b' },
            primary: { main: '#1976d2' },
          }
        : {
            background: { default: '#f7f7f9', paper: '#ffffff' },
            text: { primary: '#111', secondary: '#333' },
            primary: { main: '#1976d2' },
          }),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#202123' : '#f7f7f9',
          },
        },
      },
    },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;