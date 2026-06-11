import { NavLink as RouterNavLink, type NavLinkProps as RouterNavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends RouterNavLinkProps {
  activeClassName?: string;
}

const NavLink = ({ className, activeClassName, ...props }: NavLinkProps) => (
  <RouterNavLink
    className={({ isActive }) =>
      cn(className, isActive && activeClassName)
    }
    {...props}
  />
);

export { NavLink };