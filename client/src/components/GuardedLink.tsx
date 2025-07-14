import React from "react";
import { Link, LinkProps } from "react-router-dom";
import { useNavigationGuard } from "../hooks/useNavigationGuard";

interface GuardedLinkProps extends Omit<LinkProps, "to"> {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const GuardedLink: React.FC<GuardedLinkProps> = ({
  to,
  children,
  onClick,
  ...props
}) => {
  const { navigateWithGuard } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Call any custom onClick handler first
    if (onClick) {
      onClick(e);
    }

    // Use guarded navigation
    navigateWithGuard(to);
  };

  return (
    <Link {...props} to={to} onClick={handleClick}>
      {children}
    </Link>
  );
};

interface GuardedButtonProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const GuardedButton: React.FC<GuardedButtonProps> = ({
  to,
  children,
  className = "",
  onClick,
}) => {
  const { navigateWithGuard } = useNavigationGuard();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Call any custom onClick handler first
    if (onClick) {
      onClick(e);
    }

    // Use guarded navigation
    navigateWithGuard(to);
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};
