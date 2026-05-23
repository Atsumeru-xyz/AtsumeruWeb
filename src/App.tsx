import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {LoginPage} from './pages/LoginPage';
import {HomePage} from './pages/HomePage';
import {LibraryPage} from './pages/LibraryPage';
import {MainLayout} from './layouts/MainLayout';
import {SharingLayout} from './layouts/SharingLayout';
import {BookDetailsPage} from './pages/BookDetailsPage';
import {SettingsPage} from './pages/SettingsPage';
import {ReaderPage} from './pages/ReaderPage';
import {useAuthStore} from './store/authStore';
import type {JSX} from "react";

const ProtectedRoute = ({children}: { children: JSX.Element }) => {
    const isAuth = useAuthStore((state) => state.isAuthenticated());
    if (!isAuth) {
        return <Navigate to="/login" replace/>;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>

                <Route path="/" element={<ProtectedRoute><MainLayout/></ProtectedRoute>}>
                    <Route index element={<HomePage/>}/>
                    <Route path="library" element={<LibraryPage/>}/>
                    <Route path="book/:id" element={<BookDetailsPage/>}/>
                    <Route path="settings" element={<SettingsPage/>}/>
                    <Route path="*" element={<div>404 Not Found</div>}/>
                </Route>

                <Route
                    path="/read/:bookId/:volumeId"
                    element={
                        <ProtectedRoute>
                            <ReaderPage/>
                        </ProtectedRoute>
                    }
                />

                <Route path="/sharing/:token" element={<SharingLayout/>}>
                    <Route index element={<BookDetailsPage/>}/>
                    <Route path="read/:volumeId" element={<ReaderPage/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;