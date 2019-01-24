import React, { useState, useEffect } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import MenuIcon from "@material-ui/icons/Menu";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import AccountCircle from "@material-ui/icons/AccountCircle";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles from "@material-ui/core/styles/withStyles";
import Avatar from "@material-ui/core/Avatar";
import TextField from "@material-ui/core/TextField";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import "./fonts/fira_code.css";
import { auth, provider, db } from "./firebase";

function App(props) {
  const [docId, setDocId] = useState(0);
  const [note, setNote] = useState("");
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(
    () => {
      auth.onAuthStateChanged(user => {
        if (user) {
          setUser(user);
          db.settings({ timestampsInSnapshots: true });
          db.collection("notes")
            .where("author", "==", user.email)
            .onSnapshot(snapshot => {
              let changes = snapshot.docChanges();
              changes.forEach(change => {
                if (change.type === "added") {
                  setDocId(change.doc.id);
                } else if (change.type === "removed") {
                  setNote("");
                }
                setNote(change.doc.data().content);
              });
            });
        } else {
          setNote("");
          setDocId(null);
          setUser(null);
        }
      });
    },
    [user]
  );

  const autoSave = e => {
    if (docId) {
      db.collection("notes")
        .doc(docId)
        .update({ content: e.target.value });
    } else {
      db.collection("notes").add({
        author: user.email,
        content: e.target.value
      });
    }
  };

  const login = () => {
    auth
      .signInWithPopup(provider)
      .then(result => {
        setOpen(false);
      })
      .catch(error => {});
  };

  const { classes } = props;
  const isSignedIn = Boolean(user);
  const theme = createMuiTheme({
    typography: {
      fontFamily: "Fira Code",
      useNextVariants: true,
      suppressDeprecationWarnings: true
    }
  });
  return (
    <MuiThemeProvider theme={theme}>
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              className={classes.menuButton}
              color="inherit"
              aria-label="Menu"
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              color="inherit"
              gutterBottom
              className={classes.grow}
            >
              ToNote
            </Typography>
            <div>
              {isSignedIn ? (
                <div
                  onClick={e => {
                    setOpen(true);
                    setAnchorEl(e.currentTarget);
                  }}
                  style={{
                    width: "110%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Typography
                    color="inherit"
                    style={{ display: "inline-block" }}
                    variant="body2"
                    className={classes.grow}
                  >
                    {user.displayName}
                  </Typography>
                  <Avatar
                    style={{ display: "inline-block" }}
                    alt="Remy Sharp"
                    src={user.photoURL}
                    className={classes.avatar}
                  />
                </div>
              ) : (
                <div>
                  <Typography
                    color="inherit"
                    style={{ display: "inline-block" }}
                    variant="body2"
                    className={classes.grow}
                  >
                    Login -->
                  </Typography>
                  <IconButton
                    aria-owns={open ? "menu-appbar" : undefined}
                    aria-haspopup="true"
                    onClick={login}
                    color="inherit"
                  >
                    <AccountCircle />
                  </IconButton>
                </div>
              )}
            </div>
            {isSignedIn && (
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left"
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "left"
                }}
                open={open}
                onClose={() => setOpen(false)}
              >
                <MenuItem onClick={() => auth.signOut()}>SignOut</MenuItem>
              </Menu>
            )}
          </Toolbar>
        </AppBar>
        {isSignedIn ? (
          <TextField
            id="outlined-multiline-flexible"
            multiline
            rows={40}
            value={note}
            onChange={autoSave}
            className={classes.textField}
            margin="normal"
            variant="outlined"
          />
        ) : null}
      </div>
    </MuiThemeProvider>
  );
}

const styles = theme =>
  createStyles({
    root: {
      flexGrow: 1
    },
    grow: {
      flexGrow: 1
    },
    menuButton: {
      marginLeft: -12,
      marginRight: 20
    },
    textField: {
      width: "100%",
      height: "100%",
      fontFamily: "Comic Sans MS !important"
    }
  });

export default withStyles(styles)(App);
