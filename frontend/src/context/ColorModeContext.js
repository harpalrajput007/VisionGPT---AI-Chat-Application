import React from 'react';

export const ColorModeContext = React.createContext({
  mode: 'dark',
  toggleColorMode: () => {},
});