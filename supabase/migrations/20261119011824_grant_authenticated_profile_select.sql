-- The application reads the caller's profile after login and loads the
-- minimal active employee directory. RLS remains the row-level boundary.
GRANT SELECT ON TABLE public.profiles TO authenticated;
