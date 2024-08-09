import React, { useRef, useState, useEffect, useContext } from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../../services/ApiService';
import { AuthContext } from "../../context/AuthContext";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);

const defaultTheme = createTheme();

export default function Dashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [faceArray, setFaceArray] = useState();
  const [status, setStatus] = useState(user?.attendances[0]?.status || "checkIn");
  const [checkOutStatus, setCheckOutStatus] = useState(user?.attendances[1]?.status || "checkOut");
  const videoRef = useRef();
  const streamRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          const response = await apiService.get('/api/v1/users/verifyToken', {
            headers: { authorization: token }
          });
          if (response.status === 200) {
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            toast.error('Failed to fetch user data');
          }
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Error verifying token');
        }
      }
    };

    checkToken();
  }, [setUser]);

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (user) {
      setStatus(user.attendances[0]?.status || "checkIn");
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    navigate('/signIn');
  };

  const handleClickOpen = (newStatus) => {
    setStatus(newStatus);  // Update the status based on button clicked
    setOpen(true);
    startVideo();
  };

  const handleClose = () => {
    stopVideo();
    setOpen(false);
  };

  const handleVideoPlay = async () => {
    if (videoRef.current) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        const descriptors = detections.map((face) => Array.from(face.descriptor));
        setFaceArray(descriptors[0]);

        const params = {
          email: user?.email,
          checkInStatus: status,
          faceArray: descriptors[0],
        };

        try {
          const response = await apiService.post('/api/v1/users/markAttendence', params);
          if (response.status === 200) {
            toast.success(status === "checkIn" ? 'You are checked in today' : 'You are checked out today');
            setStatus(status === "checkIn" ? "checkOut" : "checkIn");
          }
        } catch (error) {
          toast.error(error?.response?.data?.message || 'Something went wrong');
        }

        handleClose();
      } else {
        toast.error('No face detected. Please try again.');
      }
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    }).catch((err) => {
      toast.error(`Error accessing camera: ${err.message}`);
    });
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Safeguard against user being null or undefined
  const checkInDate = user?.attendances[0]?.date ? new Date(user.attendances[0].date) : null;
  const checkOutDate = user?.attendances[1]?.date ? new Date(user.attendances[1].date) : null;

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={drawerOpen}>
          <Toolbar
            sx={{
              pr: '24px',
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{
                marginRight: '36px',
                ...(drawerOpen && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Dashboard
            </Typography>
            <Button color="inherit" onClick={handleSignOut}>
              Sign Out
            </Button>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={drawerOpen}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            <ListItem button>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <Divider sx={{ my: 1 }} />
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
              <Grid item xs={12} md={8} lg={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    CheckIn Time: {checkInDate ? checkInDate.toLocaleTimeString() : 'N/A'}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    CheckIn Date: {checkInDate ? formatDate(checkInDate) : 'N/A'}
                  </Typography>
                  <Button
                    onClick={() => handleClickOpen("checkIn")} // Pass "checkIn" status
                    fullWidth
                    disabled={status === "checkIn"}
                    variant="contained"
                    sx={{ mb: 2 }}
                  >
                    Check In
                  </Button>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    CheckOut Time: {checkOutDate ? checkOutDate.toLocaleTimeString() : 'N/A'}
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    CheckOut Date: {checkOutDate ? formatDate(checkOutDate) : 'N/A'}
                  </Typography>
                  <Button
                    onClick={() => handleClickOpen("checkOut")} // Pass "checkOut" status
                    fullWidth
                    disabled={checkOutStatus === "checkOut"}
                    variant="contained"
                  >
                    Check Out
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Capture Face Data</DialogTitle>
        <DialogContent>
          <video ref={videoRef} autoPlay style={{ width: "100%" }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleVideoPlay} color="primary">
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
