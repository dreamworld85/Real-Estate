-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 08, 2026 at 08:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `realastate_sparrow`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `category` enum('Users','Properties','System') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `category`, `created_at`) VALUES
(1, NULL, 'User registered as Seller', 'Users', '2026-07-21 18:16:06'),
(2, NULL, 'New property submitted #P10023', 'Properties', '2026-07-21 18:16:06'),
(3, NULL, 'Admin approved property #P10023', 'System', '2026-07-21 18:16:06'),
(4, NULL, 'Admin updated site settings', 'System', '2026-07-21 18:16:06'),
(5, NULL, 'User profile updated', 'Users', '2026-07-21 18:16:06'),
(6, NULL, 'Report marked as Resolved by Admin', 'System', '2026-07-22 07:31:29'),
(7, NULL, 'Property ID #1 deleted by Admin', 'Properties', '2026-07-22 07:31:44'),
(8, NULL, 'Property ID #8 status set to \'Active\' by Admin', 'Properties', '2026-07-22 07:31:48'),
(9, NULL, 'Property ID #7 status set to \'Active\' by Admin', 'Properties', '2026-07-22 07:31:50'),
(10, NULL, 'Property ID #2 deleted by Admin', 'Properties', '2026-08-07 17:30:30'),
(11, NULL, 'Property ID #3 deleted by Admin', 'Properties', '2026-08-07 17:30:35'),
(12, NULL, 'Property ID #5 deleted by Admin', 'Properties', '2026-08-07 17:30:40'),
(13, NULL, 'Property ID #6 deleted by Admin', 'Properties', '2026-08-07 17:30:44'),
(14, NULL, 'Property ID #8 deleted by Admin', 'Properties', '2026-08-07 17:30:48'),
(15, NULL, 'Property ID #7 deleted by Admin', 'Properties', '2026-08-07 17:30:53'),
(16, NULL, 'Property ID #10 deleted by Admin', 'Properties', '2026-08-07 17:30:58'),
(17, NULL, 'Property ID #9 deleted by Admin', 'Properties', '2026-08-07 17:31:02'),
(18, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:12'),
(19, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:17'),
(20, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:23'),
(21, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:29'),
(22, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:34'),
(23, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:39'),
(24, NULL, 'User completely deleted by Admin', 'Users', '2026-08-07 17:31:44'),
(25, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 17:39:44'),
(26, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 18:10:13'),
(27, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 18:12:00'),
(28, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-07 18:34:12'),
(29, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-07 18:34:12'),
(30, NULL, 'Global trial settings updated for broker to 1 days. User trial windows recalculated.', 'System', '2026-08-07 18:34:12'),
(31, NULL, 'Global trial settings updated for user to 30 days. User trial windows recalculated.', 'System', '2026-08-07 18:34:12'),
(32, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 18:53:42'),
(33, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 18:54:16'),
(34, NULL, 'Subscription plans pricing updated by Admin', 'System', '2026-08-07 18:54:59'),
(35, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-07 19:30:53'),
(36, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-07 19:30:53'),
(37, NULL, 'Global trial settings updated for broker to 2 days. User trial windows recalculated.', 'System', '2026-08-07 19:30:53'),
(38, NULL, 'Global trial settings updated for user to 10 days. User trial windows recalculated.', 'System', '2026-08-07 19:30:53'),
(39, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-07 19:31:03'),
(40, NULL, 'Global trial settings updated for broker to 2 days. User trial windows recalculated.', 'System', '2026-08-07 19:31:03'),
(41, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-07 19:31:03'),
(42, NULL, 'Global trial settings updated for user to 10 days. User trial windows recalculated.', 'System', '2026-08-07 19:31:03'),
(43, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-08 10:52:38'),
(44, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-08 10:52:38'),
(45, NULL, 'Global trial settings updated for broker to 1 days. User trial windows recalculated.', 'System', '2026-08-08 10:52:38'),
(46, NULL, 'Global trial settings updated for user to 10 days. User trial windows recalculated.', 'System', '2026-08-08 10:52:38'),
(47, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-08 10:53:05'),
(48, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-08 10:53:05'),
(49, NULL, 'Global trial settings updated for user to 10 days. User trial windows recalculated.', 'System', '2026-08-08 10:53:05'),
(50, NULL, 'Global trial settings updated for broker to 0 days. User trial windows recalculated.', 'System', '2026-08-08 10:53:05'),
(51, 8, 'User #8 activated Property #13 under Admin contact fallback number.', 'Properties', '2026-08-08 11:17:28'),
(52, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-08 14:23:30'),
(53, NULL, 'Global trial settings updated for user to 10 days. User trial windows recalculated.', 'System', '2026-08-08 14:23:30'),
(54, NULL, 'Global trial settings updated for broker to 0 days. User trial windows recalculated.', 'System', '2026-08-08 14:23:30'),
(55, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-08 14:23:30'),
(56, NULL, 'Role switch request approved for user ID #8. New Role: Agency', 'Users', '2026-08-08 14:35:25'),
(57, NULL, 'Global trial settings updated for broker to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:33:18'),
(58, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-08 16:33:18'),
(59, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:33:18'),
(60, NULL, 'Global trial settings updated for user to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:33:18'),
(61, NULL, 'Global trial settings updated for broker to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:51:54'),
(62, NULL, 'Global trial settings updated for owner to 5 days. User trial windows recalculated.', 'System', '2026-08-08 16:51:54'),
(63, NULL, 'Global trial settings updated for user to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:51:54'),
(64, NULL, 'Global trial settings updated for agency to 3 days. User trial windows recalculated.', 'System', '2026-08-08 16:51:54');

-- --------------------------------------------------------

--
-- Table structure for table `contact_clicks`
--

CREATE TABLE `contact_clicks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_clicks`
--

INSERT INTO `contact_clicks` (`id`, `user_id`, `property_id`, `created_at`) VALUES
(1, 10, 11, '2026-08-08 10:35:31'),
(3, 13, 13, '2026-08-08 15:25:22'),
(4, 12, 11, '2026-08-08 16:34:33');

-- --------------------------------------------------------

--
-- Table structure for table `enquiries`
--

CREATE TABLE `enquiries` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `visitor_id` int(11) NOT NULL,
  `message` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enquiries`
--

INSERT INTO `enquiries` (`id`, `property_id`, `visitor_id`, `message`, `created_at`) VALUES
(1, 11, 10, 'Clicked WhatsApp contact button', '2026-08-08 10:35:31'),
(3, 13, 13, 'Clicked WhatsApp contact button', '2026-08-08 15:25:22'),
(4, 11, 12, 'Clicked WhatsApp contact button', '2026-08-08 16:34:33');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `message` varchar(500) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title` varchar(120) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `sender_id`, `type`, `message`, `property_id`, `is_read`, `created_at`, `title`, `link`) VALUES
(1, 9, 10, 'like', 'Peter liked your property \"Plot / Land in Ernakulam\"', 12, 0, '2026-08-08 10:32:51', NULL, NULL),
(2, 8, 10, 'like', 'Peter liked your property \"Plot / Land in Ernakulam\"', 11, 1, '2026-08-08 10:35:37', NULL, NULL),
(4, 8, 10, 'like', 'Peter liked your property \"Apartment in Ernakulam\"', 13, 1, '2026-08-08 12:04:47', NULL, NULL),
(5, 10, 8, 'like', 'Jayakrishnan liked your property \"Apartment in Palakkad\"', 14, 1, '2026-08-08 14:32:30', NULL, NULL),
(6, 10, 8, 'review', 'Jayakrishnan submitted a new review for your property \"Apartment in Palakkad\"', 14, 1, '2026-08-08 14:32:43', 'New Property Review', '/my-properties/14'),
(7, 8, NULL, 'RoleUpgrade', 'Your role switch request has been approved! Your account role is now upgraded to Agency.', NULL, 1, '2026-08-08 14:35:25', NULL, NULL),
(8, 10, 13, 'like', 'Anjana RAJ liked your property \"Apartment in Palakkad\"', 14, 0, '2026-08-08 15:23:29', NULL, NULL),
(9, 9, 13, 'like', 'Anjana RAJ liked your property \"Plot / Land in Ernakulam\"', 12, 0, '2026-08-08 15:23:30', NULL, NULL),
(10, 9, 13, 'review', 'Anjana RAJ submitted a new review for your property \"Plot / Land in Ernakulam\"', 12, 0, '2026-08-08 15:23:41', 'New Property Review', '/my-properties/12'),
(11, 8, 12, 'like', 'Padmanabhan  liked your property \"Apartment in Ernakulam\"', 13, 1, '2026-08-08 16:45:09', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `property_type` varchar(100) NOT NULL,
  `purpose` enum('For Sale','For Rent') NOT NULL,
  `price` decimal(14,2) NOT NULL,
  `area_sqft` int(11) NOT NULL,
  `address` varchar(255) NOT NULL,
  `district` varchar(80) NOT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `furnishing` enum('Unfurnished','Semi-Furnished','Fully Furnished') DEFAULT NULL,
  `facing` varchar(20) DEFAULT NULL,
  `property_age` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `listing_role` enum('Owner','Broker','Agency') NOT NULL,
  `status` enum('Draft','Pending','Active','Inactive','Rejected') DEFAULT 'Pending',
  `views` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `contact_number` varchar(20) DEFAULT NULL,
  `whatsapp_number` varchar(20) DEFAULT NULL,
  `owner_name` varchar(120) DEFAULT NULL,
  `broker_name` varchar(120) DEFAULT NULL,
  `agency_name` varchar(120) DEFAULT NULL,
  `agency_logo_url` varchar(500) DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `use_admin_contact` tinyint(1) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_broker_personal_property` tinyint(1) NOT NULL DEFAULT 0,
  `is_price_negotiable` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `title`, `property_type`, `purpose`, `price`, `area_sqft`, `address`, `district`, `bedrooms`, `bathrooms`, `furnishing`, `facing`, `property_age`, `description`, `listing_role`, `status`, `views`, `created_at`, `updated_at`, `contact_number`, `whatsapp_number`, `owner_name`, `broker_name`, `agency_name`, `agency_logo_url`, `youtube_url`, `use_admin_contact`, `is_featured`, `is_broker_personal_property`, `is_price_negotiable`) VALUES
(11, 8, 'Plot / Land in Ernakulam', 'Plot / Land', 'For Sale', 5000000.00, 87120, 'Muvatupuzha', 'Ernakulam', 0, 0, NULL, 'East', NULL, NULL, 'Broker', 'Active', 3, '2026-08-07 18:27:56', '2026-08-08 16:38:11', '9633221243', '9633221243', NULL, 'Jayakrishnan', NULL, NULL, NULL, 0, 0, 1, 1),
(12, 9, 'Plot / Land in Ernakulam', 'Plot / Land', 'For Sale', 9000000.00, 522720, 'panmarm', 'Ernakulam', 0, 0, NULL, 'East', NULL, NULL, 'Agency', 'Active', 3, '2026-08-07 19:41:22', '2026-08-08 15:25:47', '9633221543', '9633221543', NULL, NULL, 'GREEN', '/uploads/1786131682229-97519197.png', NULL, 0, 0, 0, 1),
(13, 8, 'Apartment in Ernakulam', 'Apartment', 'For Sale', 7000000.00, 1500, 'Kaakanad', 'Ernakulam', 4, 3, 'Fully Furnished', 'North-East', '0-1 Years', NULL, 'Broker', 'Active', 5, '2026-08-08 11:17:20', '2026-08-08 16:45:07', '9633221243', '9633221243', NULL, 'Jayakrishnan', NULL, NULL, NULL, 1, 0, 1, 1),
(14, 10, 'Apartment in Palakkad', 'Apartment', 'For Sale', 5000000.00, 1800, 'pnm', 'Palakkad', 4, 3, 'Fully Furnished', 'North-East', '1-5 Years', NULL, 'Owner', 'Active', 4, '2026-08-08 14:20:19', '2026-08-08 16:43:12', '9633221143', '9633221143', 'Peter', NULL, NULL, NULL, NULL, 0, 0, 0, 1),
(15, 12, 'Plot / Land in Wayanad', 'Plot / Land', 'For Sale', 500000.00, 4356, 'panamaram', 'Wayanad', 0, 0, NULL, 'East', NULL, NULL, 'Owner', 'Active', 0, '2026-08-08 16:48:29', '2026-08-08 16:50:25', '9633221433', '9633221433', 'Padmanabhan ', NULL, NULL, NULL, NULL, 0, 0, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `property_media`
--

CREATE TABLE `property_media` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_media`
--

INSERT INTO `property_media` (`id`, `property_id`, `media_type`, `url`, `sort_order`) VALUES
(19, 11, 'image', '/uploads/1786127275805-509840192.jpeg', 0),
(20, 11, 'image', '/uploads/1786127275820-157510823.jpeg', 1),
(21, 12, 'image', '/uploads/1786131682601-889080194.jpeg', 0),
(22, 12, 'image', '/uploads/1786131682603-739132437.jpeg', 1),
(23, 13, 'image', '/uploads/1786187840180-345239622.jpeg', 0),
(24, 13, 'image', '/uploads/1786187840186-541926923.jpeg', 1),
(25, 13, 'image', '/uploads/1786187840187-171942591.jpeg', 2),
(26, 13, 'image', '/uploads/1786187840188-124118414.jpeg', 3),
(27, 14, 'image', '/uploads/1786198819592-880791890.jpeg', 0),
(28, 14, 'image', '/uploads/1786199496449-989997101.jpeg', 1),
(29, 14, 'image', '/uploads/1786199496454-200727842.jpeg', 2),
(30, 15, 'image', '/uploads/1786207709606-326491040.jpeg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `property_reviews`
--

CREATE TABLE `property_reviews` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_reviews`
--

INSERT INTO `property_reviews` (`id`, `property_id`, `user_id`, `rating`, `comment`, `created_at`) VALUES
(7, 13, 10, 4, 'Nice Apartment', '2026-08-08 12:05:00'),
(8, 13, 10, 4, 'Nice Apartment', '2026-08-08 12:05:02'),
(9, 12, 10, 3, 'Nice Land', '2026-08-08 12:13:35'),
(10, 11, 10, 3, 'nice', '2026-08-08 12:18:11'),
(11, 14, 8, 3, 'Nice apartment', '2026-08-08 14:32:43'),
(12, 12, 13, 3, 'nice\n', '2026-08-08 15:23:41');

-- --------------------------------------------------------

--
-- Table structure for table `property_views`
--

CREATE TABLE `property_views` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `visitor_id` int(11) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(100) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_views`
--

INSERT INTO `property_views` (`id`, `property_id`, `visitor_id`, `viewed_at`, `ip_address`, `user_agent`) VALUES
(88, 14, 12, '2026-08-08 15:16:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(89, 13, 12, '2026-08-08 15:16:25', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(90, 12, 12, '2026-08-08 15:16:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(91, 11, 12, '2026-08-08 15:16:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(92, 11, 13, '2026-08-08 15:23:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(93, 14, 13, '2026-08-08 15:23:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(94, 12, 13, '2026-08-08 15:23:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(95, 13, 13, '2026-08-08 15:23:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(96, 12, 8, '2026-08-08 15:25:47', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(97, 13, 11, '2026-08-08 16:29:46', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(98, 14, 12, '2026-08-08 16:38:05', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(99, 11, 12, '2026-08-08 16:38:11', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(100, 13, 12, '2026-08-08 16:38:20', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(101, 14, 12, '2026-08-08 16:43:12', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0'),
(102, 13, 12, '2026-08-08 16:45:07', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0');

-- --------------------------------------------------------

--
-- Table structure for table `reported_listings`
--

CREATE TABLE `reported_listings` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `status` enum('Pending','Resolved') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_switch_requests`
--

CREATE TABLE `role_switch_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `requested_role` enum('Broker','Agency') NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `role_switch_requests`
--

INSERT INTO `role_switch_requests` (`id`, `user_id`, `requested_role`, `status`, `created_at`, `updated_at`) VALUES
(1, 8, 'Agency', 'Approved', '2026-08-08 10:25:13', '2026-08-08 14:35:25');

-- --------------------------------------------------------

--
-- Table structure for table `saved_properties`
--

CREATE TABLE `saved_properties` (
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `saved_properties`
--

INSERT INTO `saved_properties` (`user_id`, `property_id`, `created_at`) VALUES
(8, 11, '2026-08-07 19:44:59'),
(8, 14, '2026-08-08 14:32:30'),
(10, 11, '2026-08-08 10:35:37'),
(10, 12, '2026-08-08 10:32:51'),
(10, 13, '2026-08-08 12:04:47'),
(12, 13, '2026-08-08 16:45:09'),
(12, 15, '2026-08-08 16:53:52'),
(13, 12, '2026-08-08 15:23:30'),
(13, 14, '2026-08-08 15:23:29');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`key`, `value`) VALUES
('admin_contact_number', '+91 94460 12346'),
('admin_email', 'admin@keralarealty.com'),
('contact_address', 'GreenSparrows Ventures Private Limited,\nSkyline Signature Heights, Kakkanad,\nKochi, Kerala - 682030'),
('contact_email', 'support@greensparrows.com'),
('contact_phone', '+91 9633221243  (10 AM - 6 PM)'),
('default_free_inquiries_limit', '15'),
('default_trial_days', '5'),
('default_trial_days_agency', '3'),
('default_trial_days_broker', '3'),
('default_trial_days_user', '3'),
('featured_price', '20'),
('featured_text', 'You can market your property to get higher leads'),
('login_banner_url', '/uploads/1784713931417-589645004.jpeg'),
('welcome_banner_url', '/uploads/1784713395253-120595938.jpeg');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `role` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description` varchar(255) DEFAULT '',
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `duration_months` int(11) NOT NULL DEFAULT 1,
  `features` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`role`, `price`, `updated_at`, `description`, `discount`, `duration_months`, `features`) VALUES
('agency', 0.00, '2026-08-08 18:12:30', 'Agency free trial to configure corporate office and agents.', 0.00, 0, '[\"Post up to 5 properties free trial limit\",\"Direct email support\",\"Upload agency logo branding\"]'),
('agency', 1499.00, '2026-08-08 18:12:30', 'Agency features + contact unlocks for 1 month.', 200.00, 1, '[\"Multiple broker account seats\",\"Agency branding & logo on listings\",\"Dedicated agency profile page\",\"Premium visibility filters\"]'),
('agency', 7499.00, '2026-08-08 18:12:30', 'Agency features + contact unlocks for 6 months.', 1000.00, 6, '[\"Multiple broker account seats\",\"Agency branding & logo on listings\",\"Dedicated agency profile page\",\"Premium visibility filters\",\"3 Featured listing boosters\"]'),
('agency', 12999.00, '2026-08-08 18:12:30', 'Agency features + contact unlocks for 12 months.', 2000.00, 12, '[\"Multiple broker account seats\",\"Agency branding & logo on listings\",\"Dedicated agency profile page\",\"Premium visibility filters\",\"8 Featured listing boosters\",\"Personal account manager\"]'),
('broker', 0.00, '2026-08-08 18:12:30', 'Broker free trial to list properties and manage leads.', 0.00, 0, '[\"Post up to 5 properties free trial limit\",\"Direct email support\",\"Simple property wizard\"]'),
('broker', 799.00, '2026-08-08 18:12:30', 'Broker features + contact unlocks for 1 month.', 100.00, 1, '[\"Unlimited property listings\",\"Dedicated broker profile page\",\"Lead generation alerts\",\"Interactive customer inquiries tab\"]'),
('broker', 3999.00, '2026-08-08 18:12:30', 'Broker features + contact unlocks for 6 months.', 500.00, 6, '[\"Unlimited property listings\",\"Dedicated broker profile page\",\"Lead generation alerts\",\"Interactive customer inquiries tab\",\"2 Featured listing boosters\"]'),
('broker', 6999.00, '2026-08-08 18:12:30', 'Broker features + contact unlocks for 12 months.', 1000.00, 12, '[\"Unlimited property listings\",\"Dedicated broker profile page\",\"Lead generation alerts\",\"Interactive customer inquiries tab\",\"5 Featured listing boosters\",\"Priority listing verification\"]'),
('owner', 0.00, '2026-08-08 18:12:30', 'Individual property owner free tier with basic posting.', 0.00, 0, '[\"Post up to 2 properties completely free\",\"Simple listing editor\",\"Basic email support\"]'),
('owner', 399.00, '2026-08-08 18:12:30', 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 1 month.', 50.00, 1, '[\"Post up to 5 properties\",\"View visitor statistics & leads\",\"Premium listing badge\",\"Direct lead contact details\"]'),
('owner', 1999.00, '2026-08-08 18:12:30', 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 6 months.', 300.00, 6, '[\"Post up to 5 properties\",\"View visitor statistics & leads\",\"Premium listing badge\",\"Direct lead contact details\",\"1 Featured listing booster\"]'),
('owner', 3499.00, '2026-08-08 18:12:30', 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 12 months.', 600.00, 12, '[\"Post up to 5 properties\",\"View visitor statistics & leads\",\"Premium listing badge\",\"Direct lead contact details\",\"3 Featured listing boosters\",\"Email marketing to active buyers\"]'),
('user', 0.00, '2026-08-08 18:12:30', 'Basic buyer account with search and saved property access.', 0.00, 0, '[\"Browse active listings\",\"Search and filter districts\",\"Save favorite properties\"]'),
('user', 299.00, '2026-08-08 18:12:30', 'Unlimited contact reveals & direct inquiry access for 1 month.', 50.00, 1, '[\"Reveal direct owner contacts\",\"WhatsApp chat shortcuts\",\"Save favorite listings\",\"Direct contact logs\"]'),
('user', 1499.00, '2026-08-08 18:12:30', 'Unlimited contact reveals & direct inquiry access for 6 months.', 200.00, 6, '[\"Reveal direct owner contacts\",\"WhatsApp chat shortcuts\",\"Save favorite listings\",\"Direct contact logs\",\"Email notifications for price drops\"]'),
('user', 2499.00, '2026-08-08 18:12:30', 'Unlimited contact reveals & direct inquiry access for 12 months.', 400.00, 12, '[\"Reveal direct owner contacts\",\"WhatsApp chat shortcuts\",\"Save favorite listings\",\"Direct contact logs\",\"Email notifications for price drops\",\"Priority support\"]');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `location` varchar(160) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_disabled` tinyint(4) DEFAULT 0,
  `last_login` timestamp NULL DEFAULT NULL,
  `role` enum('owner','broker','agency','user','Admin') DEFAULT 'user',
  `trial_ends_at` datetime DEFAULT NULL,
  `subscription_status` varchar(50) DEFAULT NULL,
  `razorpay_subscription_id` varchar(255) DEFAULT NULL,
  `custom_trial_expiry` datetime DEFAULT NULL,
  `is_free_subscription_granted` tinyint(1) NOT NULL DEFAULT 0,
  `subscription_expires_at` datetime DEFAULT NULL,
  `subscription_duration_months` int(11) DEFAULT NULL,
  `agency_address` text DEFAULT NULL,
  `agency_district` varchar(100) DEFAULT NULL,
  `agency_logo_url` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `location`, `avatar_url`, `created_at`, `is_disabled`, `last_login`, `role`, `trial_ends_at`, `subscription_status`, `razorpay_subscription_id`, `custom_trial_expiry`, `is_free_subscription_granted`, `subscription_expires_at`, `subscription_duration_months`, `agency_address`, `agency_district`, `agency_logo_url`, `whatsapp_number`) VALUES
(8, 'Jayakrishnan', 'jaya@gmail.com', '9633221243', '$2a$10$MvXIUj9L9fWfs4S.degJf.B2EG8Pc0ideKDHOMWIjeEGMUl7xikMy', NULL, NULL, '2026-08-07 17:38:42', 0, '2026-08-08 17:42:04', 'agency', '2026-08-10 23:08:42', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'GREEN', 'thinkal@gmail.com', '9633221543', '$2a$10$BcL7Mu7G8mHSyFe.K2p6yuuh5EN8fjLa4tHK70N6FcXLMnZSJCmLO', NULL, '/uploads/1786131574504-751748905.png', '2026-08-07 19:06:00', 0, '2026-08-07 19:06:00', 'agency', '2026-08-11 00:36:00', NULL, NULL, NULL, 0, NULL, NULL, 'greenvalley, kakanad , kochi', 'Ernakulam', '/uploads/1786131574504-751748905.png', NULL),
(10, 'Peter', 'peter@gmail.com', '9633221143', '$2a$10$3rIamYeNBsJORmg2Km.ix.lZknvFG7fsXjT3iMuXZ3VNJr/bFzf0e', NULL, NULL, '2026-08-08 10:32:38', 0, '2026-08-08 17:20:52', 'owner', '2026-08-13 16:02:38', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '9633221143'),
(12, 'Padmanabhan ', 'padma@gmail.com', '9633221433', '$2a$10$bx.NH5qIkWNI/W8MRyFd..cABP5MA0CqG.o5LaEDs.mKNr78ix4RC', NULL, NULL, '2026-08-08 15:13:06', 0, '2026-08-08 16:42:43', 'owner', '2026-08-13 20:43:06', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '9633221433'),
(13, 'Anjana RAJ', 'anjanaraj1243@gmail.com', '7012021221', '$2a$10$vdo1NQwOKvZID79D/9m6uezYMhYbxPnzMUYvgOmc.2dh/rWZB5LiW', NULL, NULL, '2026-08-08 15:23:13', 0, '2026-08-08 15:23:13', 'user', '2026-08-11 20:53:13', NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `contact_clicks`
--
ALTER TABLE `contact_clicks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_property` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `visitor_id` (`visitor_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `property_media`
--
ALTER TABLE `property_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_reviews`
--
ALTER TABLE `property_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `property_views`
--
ALTER TABLE `property_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `reported_listings`
--
ALTER TABLE `reported_listings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `reporter_id` (`reporter_id`);

--
-- Indexes for table `role_switch_requests`
--
ALTER TABLE `role_switch_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD PRIMARY KEY (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`role`,`duration_months`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `contact_clicks`
--
ALTER TABLE `contact_clicks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `property_media`
--
ALTER TABLE `property_media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `property_reviews`
--
ALTER TABLE `property_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `property_views`
--
ALTER TABLE `property_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `reported_listings`
--
ALTER TABLE `reported_listings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `role_switch_requests`
--
ALTER TABLE `role_switch_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contact_clicks`
--
ALTER TABLE `contact_clicks`
  ADD CONSTRAINT `contact_clicks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contact_clicks_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD CONSTRAINT `enquiries_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enquiries_ibfk_2` FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_media`
--
ALTER TABLE `property_media`
  ADD CONSTRAINT `property_media_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_reviews`
--
ALTER TABLE `property_reviews`
  ADD CONSTRAINT `property_reviews_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_views`
--
ALTER TABLE `property_views`
  ADD CONSTRAINT `property_views_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reported_listings`
--
ALTER TABLE `reported_listings`
  ADD CONSTRAINT `reported_listings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reported_listings_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_switch_requests`
--
ALTER TABLE `role_switch_requests`
  ADD CONSTRAINT `role_switch_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD CONSTRAINT `saved_properties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_properties_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
