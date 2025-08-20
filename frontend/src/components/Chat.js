import React, { useState, useEffect } from 'react';
import { 
    AppBar, Toolbar, Box, TextField, Button, Paper, Typography, List, ListItem, 
    ListItemText, IconButton, Avatar, Menu, MenuItem, useTheme, CircularProgress 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ColorModeContext } from '../context/ColorModeContext';
import { api } from '../api';

const CodeBlock = ({ code, language }) => {
    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        // Could add visual feedback here if needed
    };

    return (
        <Box sx={{ position: 'relative', my: 2 }}>
            <Box sx={{ 
                position: 'absolute', 
                right: 8, 
                top: 8, 
                zIndex: 1,
                display: 'flex',
                gap: 1
            }}>
                <IconButton 
                    size="small" 
                    onClick={handleCopy}
                    sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                >
                    <ContentCopyIcon fontSize="small" />
                </IconButton>
                <IconButton 
                    size="small"
                    sx={{ 
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box sx={(theme) => ({ 
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: theme.palette.mode === 'dark' ? '#0f1115' : '#f8f9fa',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
            })}>
                <Box sx={(theme) => ({ 
                    px: 1.5, py: 0.75,
                    bgcolor: 'transparent',
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    fontSize: '0.75rem',
                    textTransform: 'lowercase'
                })}>
                    {language || 'text'}
                </Box>
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        padding: '16px',
                        background: 'transparent', // make pre tag transparent
                        borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}
                    codeTagProps={{ style: { background: 'transparent' } }} // make code tag transparent
                    lineProps={{ style: { background: 'transparent' } }}
                    wrapLines
                    wrapLongLines
                    showLineNumbers={false}
                >
                    {code}
                </SyntaxHighlighter>
            </Box>
        </Box>
    );
};

const MessageContent = ({ content, forceWhiteText = false }) => {
    // Split content into text and fenced code blocks (```lang\n...```)
    const blocks = content.split(/(```[\s\S]*?```)/g);

    // Parse inline markdown (bold/italic) without using innerHTML
    const renderInlineMD = (text, keyPrefix) => {
        const out = [];
        const regex = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g; // **bold** or *italic*
        let lastIndex = 0;
        let match;
        let idx = 0;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                out.push(<React.Fragment key={`${keyPrefix}-t-${idx++}`}>{text.slice(lastIndex, match.index)}</React.Fragment>);
            }
            if (match[1]) {
                out.push(<strong key={`${keyPrefix}-b-${idx++}`}>{match[2]}</strong>);
            } else {
                out.push(<em key={`${keyPrefix}-i-${idx++}`}>{match[4]}</em>);
            }
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < text.length) {
            out.push(<React.Fragment key={`${keyPrefix}-r-${idx++}`}>{text.slice(lastIndex)}</React.Fragment>);
        }
        return out;
    };

    return blocks.map((block, i) => {
        const isFence = block.startsWith('```') && block.endsWith('```');
        if (isFence) {
            // Extract first line as language and the rest as code body
            const firstNewline = block.indexOf('\n');
            const lang = block.slice(3, firstNewline).trim();
            const code = block.slice(firstNewline + 1, block.length - 3);
            return <CodeBlock key={`code-${i}`} code={code} language={lang || 'text'} />;
        }
        // Render rich text with lists, inline code, and markdown emphasis (bold/italic)
        const renderWithInline = (text, keyPrefix) => (
            text.split(/(`[^`]+`)/g).map((seg, j) => {
                if (seg.startsWith('`') && seg.endsWith('`')) {
                    return (
                        <Box key={`inline-${keyPrefix}-${j}`} component="code" sx={(theme) => ({
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            color: forceWhiteText ? '#fff' : (theme.palette.mode === 'dark' ? '#e6e6e6' : '#111'),
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 1,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            fontSize: '0.9em'
                        })}>
                            {seg.slice(1, -1)}
                        </Box>
                    );
                }
                return <React.Fragment key={`text-${keyPrefix}-${j}`}>{renderInlineMD(seg, `md-${keyPrefix}-${j}`)}</React.Fragment>;
            })
        );

        const lines = block.split('\n');
        const elements = [];
        let idxLine = 0;
        while (idxLine < lines.length) {
            const line = lines[idxLine];
            const bulletMatch = /^\s*[*-]\s+(.+)/.exec(line);
            if (bulletMatch) {
                const items = [];
                while (idxLine < lines.length) {
                    const m = /^\s*[*-]\s+(.+)/.exec(lines[idxLine]);
                    if (!m) break;
                    items.push(m[1]);
                    idxLine++;
                }
                elements.push(
                    <Box key={`ul-${i}-${idxLine}`} component="ul" sx={(theme) => ({ ml: 3, my: 1, color: forceWhiteText ? '#fff' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : theme.palette.text.primary) })}>
                        {items.map((t, k) => (
                            <Box key={`li-${i}-${k}`} component="li" sx={{ lineHeight: 1.6 }}>
                                {renderWithInline(t, `${i}-${k}`)}
                            </Box>
                        ))}
                    </Box>
                );
                continue;
            }

            // Collect paragraph until blank line or bullet start
            const para = [];
            while (idxLine < lines.length && !/^\s*$/.test(lines[idxLine]) && !/^\s*[*-]\s+/.test(lines[idxLine])) {
                para.push(lines[idxLine]);
                idxLine++;
            }
            // Skip single blank lines
            while (idxLine < lines.length && /^\s*$/.test(lines[idxLine])) idxLine++;

            if (para.length) {
                const text = para.join('\n');
                elements.push(
                    <Typography key={`p-${i}-${idxLine}`} sx={(theme) => ({ whiteSpace: 'pre-wrap', color: forceWhiteText ? '#fff' : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : theme.palette.text.primary), lineHeight: 1.6, mb: 1 })}>
                        {renderWithInline(text, `p-${i}`)}
                    </Typography>
                );
            }
        }

        return elements;
    });
};

const ThemeToggle = () => {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    const isDark = theme.palette.mode === 'dark';
    return (
        <IconButton onClick={colorMode.toggleColorMode} aria-label="toggle theme" sx={(theme) => ({
            color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
        })}>
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
    );
};

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState('new');
    const [chats, setChats] = useState([]);
    const [hoveredChat, setHoveredChat] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('visiongpt-sidebar-width');
        return saved ? parseInt(saved, 10) : 360;
    });
    const [isResizing, setIsResizing] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchChats();
    }, [user, navigate]); // fetchChats is stable, no need to include

    const fetchChats = async () => {
        try {
            const response = await api.get('/api/chats', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setChats(response.data);
            // Do not auto-open any previous chat after login; start with a new chat state with welcome message
            setCurrentChatId('new');
            setMessages([{
                role: 'assistant',
                content: 'Hello! How can I help you today?'
            }]);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const handleNewChat = async () => {
        try {
            // Reset to new chat state immediately
            setCurrentChatId('new');
            setMessages([{
                role: 'assistant',
                content: 'Hello! How can I help you today?'
            }]);
            
            // Optionally create a new chat on the server (commented out to avoid server call until first message)
            // const response = await api.post('/api/chats/new', {}, {
            //     headers: { Authorization: `Bearer ${user.token}` }
            // });
            // setCurrentChatId(response.data._id);
            // await fetchChats();
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };

    const selectChat = async (chatId) => {
        try {
            const response = await api.get(`/api/chats/${chatId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setCurrentChatId(chatId);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    const handleDeleteChat = async (chatId, event) => {
        event.stopPropagation(); // Prevent chat selection when clicking delete
        try {
            await api.delete(`/api/chats/${chatId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Remove chat from state
            setChats(chats.filter(chat => chat._id !== chatId));
            
            // If current chat was deleted, reset to new chat with welcome message
            if (currentChatId === chatId) {
                setCurrentChatId('new');
                setMessages([{
                    role: 'assistant',
                    content: 'Hello! How can I help you today?'
                }]);
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        const messageText = input.trim();
        setInput('');

        try {
            let chatId = currentChatId;
            const isNewChat = currentChatId === 'new';
            
            // If this is a new chat, create it first
            if (isNewChat) {
                const newChatResponse = await api.post('/api/chats/new', {}, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                chatId = newChatResponse.data._id;
                setCurrentChatId(chatId);
            }

            // Send the message
            const response = await api.post(
                `/api/chats/${chatId}/messages`,
                { message: messageText },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update messages
            setMessages(response.data.messages);
            
            // Handle chat list updates
            if (isNewChat) {
                // Add new chat to the beginning of the list
                setChats(prev => [response.data, ...prev]);
            } else {
                // Update existing chat in the list
                setChats(prev => prev.map(chat => 
                    chat._id === chatId 
                        ? { ...chat, title: response.data.title, messages: response.data.messages }
                        : chat
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to send message. Please try again.';
            if (error.response) {
                // Server responded with error status
                errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Unable to connect to server. Please check your connection.';
            }
            
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
        navigate('/login');
    };

    // Sidebar resize functionality
    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleResizeMove = React.useCallback((e) => {
        if (!isResizing) return;
        
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
    }, [isResizing]);

    const handleResizeEnd = React.useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Add event listeners for resize
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    // Save sidebar width to localStorage
    React.useEffect(() => {
        localStorage.setItem('visiongpt-sidebar-width', sidebarWidth.toString());
    }, [sidebarWidth]);

    return (
        <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', position: 'relative' }}>
            {/* Resize Overlay - shows when resizing */}
            {isResizing && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                    }}
                />
            )}

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Box sx={(theme) => ({ 
                    width: isSidebarOpen ? sidebarWidth : 80,
                    transition: isResizing ? 'none' : 'width 200ms ease',
                    overflow: 'hidden',
                    bgcolor: theme.palette.mode === 'dark' ? '#1f1f23' : '#ffffff',
                    borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                })}>
                    {/* Sidebar Header */}
                    <Box sx={(theme) => ({ 
                        height: 64, // Match AppBar height
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                    })}>
                        {isSidebarOpen && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <img src="/VisionGPTLogo.png" alt="VisionGPT" width={28} height={28} style={{ borderRadius: 6 }} />
                            </Box>
                        )}
                        <IconButton 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            sx={(theme) => ({ 
                                color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                                '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                            })}
                        >
                            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </IconButton>
                    </Box>

                    {/* New Chat Button */}
                    {isSidebarOpen && (
                        <Box sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleNewChat}
                                sx={(theme) => ({
                                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                    color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                                    '&:hover': {
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                    }
                                })}
                            >
                                New Chat
                            </Button>
                        </Box>
                    )}

                    {/* Chats Header */}
                    {isSidebarOpen && (
                        <Box sx={{ px: 2, pb: 1 }}>
                            <Typography 
                                variant="body2" 
                                sx={(theme) => ({
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                })}
                            >
                                Chats
                            </Typography>
                        </Box>
                    )}

                    {/* Chat List */}
                    {isSidebarOpen && (
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <List sx={{ p: 1, pt: 0 }}>
                                {chats.map((chat) => (
                                    <ListItem
                                        key={chat._id}
                                        button
                                        selected={currentChatId === chat._id}
                                        onClick={() => selectChat(chat._id)}
                                        onMouseEnter={() => setHoveredChat(chat._id)}
                                        onMouseLeave={() => setHoveredChat(null)}
                                        sx={(theme) => ({
                                            borderRadius: 2,
                                            mb: 0.5,
                                            '&.Mui-selected': {
                                                bgcolor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.1)' 
                                                    : 'rgba(0, 0, 0, 0.08)',
                                            },
                                            '&.Mui-selected:hover': {
                                                bgcolor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(255, 255, 255, 0.15)' 
                                                    : 'rgba(0, 0, 0, 0.12)',
                                            },
                                            '&:hover:not(.Mui-selected)': {
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                            }
                                        })}
                                    >
                                        <ListItemText
                                            primary={chat.title}
                                            primaryTypographyProps={{
                                                sx: (theme) => ({
                                                    fontSize: '0.9rem',
                                                    color: currentChatId === chat._id 
                                                        ? (theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary)
                                                        : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : theme.palette.text.primary),
                                                    fontWeight: currentChatId === chat._id ? 600 : 400,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                })
                                            }}
                                        />
                                        {hoveredChat === chat._id && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleDeleteChat(chat._id, e)}
                                                sx={(theme) => ({
                                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                                    '&:hover': {
                                                        color: theme.palette.mode === 'dark' ? '#ff6b6b' : '#d32f2f',
                                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,107,107,0.1)' : 'rgba(211,47,47,0.1)'
                                                    }
                                                })}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}

                    {/* User Menu */}
                    {isSidebarOpen && (
                        <Box sx={(theme) => ({ 
                            minHeight: 80, // Match input area height
                            px: 2,
                            py: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                        })}>
                            <Box
                                onClick={handleUserMenuClick}
                                sx={(theme) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                    }
                                })}
                            >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    <AccountCircleIcon />
                                </Avatar>
                                <Typography variant="body2" sx={(theme) => ({ 
                                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : theme.palette.text.primary,
                                    fontWeight: 500
                                })}>
                                    {user?.username}
                                </Typography>
                            </Box>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleUserMenuClose}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            >
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 1 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}

                    {/* Floating User Avatar when sidebar is closed */}
                    {!isSidebarOpen && (
                        <Box
                            sx={{
                                position: 'fixed',
                                bottom: 20,
                                left: 20,
                                zIndex: 1000,
                            }}
                        >
                            <Avatar
                                onClick={handleUserMenuClick}
                                sx={(theme) => ({
                                    width: 48,
                                    height: 48,
                                    cursor: 'pointer',
                                    bgcolor: theme.palette.mode === 'dark' ? '#667eea' : '#764ba2',
                                    boxShadow: theme.palette.mode === 'dark' 
                                        ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                                        : '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: theme.palette.mode === 'dark' 
                                            ? '0 6px 25px rgba(0, 0, 0, 0.4)' 
                                            : '0 6px 25px rgba(0, 0, 0, 0.2)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                })}
                            >
                                <AccountCircleIcon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleUserMenuClose}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            >
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 1 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}

                    {/* Resize Handle */}
                    {isSidebarOpen && (
                        <Box
                            onMouseDown={handleResizeStart}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                cursor: 'col-resize',
                                backgroundColor: 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 123, 255, 0.3)',
                                },
                                zIndex: 1000,
                            }}
                        />
                    )}
                </Box>

                {/* Chat Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Chat Header */}
                    <AppBar 
                        position="static" 
                        elevation={0}
                        sx={(theme) => ({ 
                            bgcolor: theme.palette.mode === 'dark' ? '#26262b' : '#ffffff',
                            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                        })}
                    >
                        <Toolbar>
                            {!isSidebarOpen && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                    <img src="/VisionGPTLogo.png" alt="VisionGPT" width={28} height={28} style={{ borderRadius: 6 }} />
                                </Box>
                            )}
                            <Typography 
                                variant="h6" 
                                sx={(theme) => ({ 
                                    flexGrow: 1,
                                    color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                                    fontWeight: 700
                                })}
                            >
                                VisionGPT
                            </Typography>
                            <ThemeToggle />
                        </Toolbar>
                    </AppBar>

                    {/* Messages Area */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {messages.map((message, index) => (
                            <Box key={index} sx={{ mb: 3 }}>
                                {message.role === 'user' ? (
                                    // User messages - right aligned
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'flex-end',
                                        alignItems: 'flex-start',
                                        gap: 2
                                    }}>
                                        <Paper 
                                            elevation={0}
                                            sx={(theme) => ({ 
                                                maxWidth: '70%',
                                                p: 2,
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(25, 118, 210, 0.1)'}`,
                                                borderRadius: 2
                                            })}
                                        >
                                            <MessageContent content={message.content} />
                                        </Paper>
                                        <Avatar sx={(theme) => ({ 
                                            width: 32, 
                                            height: 32,
                                            bgcolor: theme.palette.mode === 'dark' ? '#667eea' : '#1976d2'
                                        })}>
                                            {user?.username?.[0]?.toUpperCase()}
                                        </Avatar>
                                    </Box>
                                ) : (
                                    // AI messages - left aligned
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: 2
                                    }}>
                                        <Avatar sx={(theme) => ({ 
                                            width: 32, 
                                            height: 32,
                                            bgcolor: theme.palette.mode === 'dark' ? '#764ba2' : '#9c27b0'
                                        })}>
                                            AI
                                        </Avatar>
                                        <Paper 
                                            elevation={0}
                                            sx={(theme) => ({ 
                                                maxWidth: '70%',
                                                p: 2,
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(118, 75, 162, 0.1)' : 'rgba(156, 39, 176, 0.05)',
                                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(118, 75, 162, 0.2)' : 'rgba(156, 39, 176, 0.1)'}`,
                                                borderRadius: 2
                                            })}
                                        >
                                            <MessageContent content={message.content} />
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: 2, 
                                mb: 3,
                                justifyContent: 'flex-start'
                            }}>
                                <Avatar sx={(theme) => ({ 
                                    width: 32, 
                                    height: 32,
                                    bgcolor: theme.palette.mode === 'dark' ? '#764ba2' : '#9c27b0'
                                })}>
                                    AI
                                </Avatar>
                                <Paper 
                                    elevation={0}
                                    sx={(theme) => ({ 
                                        maxWidth: '70%',
                                        p: 2,
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(118, 75, 162, 0.1)' : 'rgba(156, 39, 176, 0.05)',
                                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(118, 75, 162, 0.2)' : 'rgba(156, 39, 176, 0.1)'}`,
                                        borderRadius: 2
                                    })}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={18} thickness={4} />
                                        <Typography sx={(theme) => ({ 
                                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                                        })}>
                                            Generating response...
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                    </Box>

                    {/* Input Area - ChatGPT Style */}
                    <Box sx={(theme) => ({ 
                        minHeight: 80, // Match sidebar footer height
                        px: 2,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                    })}>
                        <Box 
                            component="form" 
                            onSubmit={handleSubmit} 
                            sx={(theme) => ({ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1, 
                                width: '100%',
                                maxWidth: 800,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#ffffff',
                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                                borderRadius: 3,
                                px: 2,
                                py: 1,
                                '&:hover': {
                                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                },
                                '&:focus-within': {
                                    borderColor: theme.palette.mode === 'dark' ? '#667eea' : '#1976d2',
                                    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(25, 118, 210, 0.2)'}`,
                                }
                            })}
                        >
                            <TextField
                                fullWidth
                                multiline
                                maxRows={3}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message VisionGPT..."
                                disabled={isLoading}
                                variant="standard"
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                sx={(theme) => ({
                                    '& .MuiInputBase-input': {
                                        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                        fontSize: '14px',
                                        lineHeight: 1.4,
                                        py: 0.5,
                                        '&::placeholder': {
                                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                            opacity: 1,
                                        },
                                    },
                                })}
                            />
                            <Button
                                type="submit"
                                variant="text"
                                disabled={!input.trim() || isLoading}
                                sx={(theme) => ({
                                    minWidth: 'auto',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 2,
                                    p: 0,
                                    color: input.trim() && !isLoading 
                                        ? (theme.palette.mode === 'dark' ? '#667eea' : '#1976d2')
                                        : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    },
                                    '&:disabled': {
                                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                    }
                                })}
                            >
                                <SendIcon sx={{ fontSize: 18 }} />
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Chat;