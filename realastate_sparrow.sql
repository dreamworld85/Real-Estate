-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 23, 2026 at 08:40 AM
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
(1, 1, 'User registered as Seller', 'Users', '2026-07-21 18:16:06'),
(2, 1, 'New property submitted #P10023', 'Properties', '2026-07-21 18:16:06'),
(3, NULL, 'Admin approved property #P10023', 'System', '2026-07-21 18:16:06'),
(4, NULL, 'Admin updated site settings', 'System', '2026-07-21 18:16:06'),
(5, 1, 'User profile updated', 'Users', '2026-07-21 18:16:06'),
(6, NULL, 'Report marked as Resolved by Admin', 'System', '2026-07-22 07:31:29'),
(7, NULL, 'Property ID #1 deleted by Admin', 'Properties', '2026-07-22 07:31:44'),
(8, NULL, 'Property ID #8 status set to \'Active\' by Admin', 'Properties', '2026-07-22 07:31:48'),
(9, NULL, 'Property ID #7 status set to \'Active\' by Admin', 'Properties', '2026-07-22 07:31:50');

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
  `youtube_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `owner_id`, `title`, `property_type`, `purpose`, `price`, `area_sqft`, `address`, `district`, `bedrooms`, `bathrooms`, `furnishing`, `facing`, `property_age`, `description`, `listing_role`, `status`, `views`, `created_at`, `updated_at`, `contact_number`, `whatsapp_number`, `owner_name`, `broker_name`, `agency_name`, `agency_logo_url`, `youtube_url`) VALUES
(2, 2, 'Villa in Pathanamthitta', 'Villa', 'For Sale', 500000.00, 1000, 'pnm', 'Pathanamthitta', 2, 3, 'Unfurnished', 'West', '1-5 Years', 'qwq', 'Owner', 'Active', 6, '2026-07-18 18:21:09', '2026-07-18 18:26:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 2, 'Land in Kottayam', 'Land', 'For Sale', 500000.00, 5000, 'pnm', 'Kottayam', 0, 0, NULL, 'North', NULL, 'uuuuuu', 'Agency', 'Active', 38, '2026-07-18 18:24:23', '2026-07-23 06:08:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 4, 'Plot / Land in Kollam', 'Plot / Land', 'For Sale', 60000.00, 217800, 'njjj', 'Kollam', 0, 0, NULL, 'West', NULL, 'kkkk', 'Owner', 'Active', 16, '2026-07-21 17:16:28', '2026-07-21 20:45:33', '7012021221', '7012021221', '  sample ', NULL, NULL, NULL, NULL),
(6, 4, 'Other in Kannur', 'Other', 'For Sale', 900000.00, 5000, 'uuuuu', 'Kannur', 3, 2, 'Fully Furnished', 'North', '5-10 Years', 'kkkkkkkkkkk', 'Agency', 'Active', 30, '2026-07-21 17:23:10', '2026-07-22 07:52:00', '12345698', '12345698', NULL, NULL, 'netlu', '/uploads/1784654590289-849384051.png', NULL),
(7, 4, 'Farmhouse in Wayanad', 'Farmhouse', 'For Sale', 600000.00, 8001, 'pnm', 'Wayanad', 2, 1, 'Semi-Furnished', 'West', '0-1 Years', 'n', 'Owner', 'Active', 2, '2026-07-21 19:44:14', '2026-07-22 07:51:35', '7012021221', '7012021221', '  sample ', NULL, NULL, NULL, NULL),
(8, 4, 'Office Space in Alappuzha', 'Office Space', 'For Sale', 800000.00, 8550, '55', 'Alappuzha', 0, 2, 'Fully Furnished', 'West', '10+ Years', NULL, 'Broker', 'Active', 4, '2026-07-21 19:46:38', '2026-07-22 07:51:32', '7012021221', '7012021221', NULL, 'anjana', NULL, NULL, NULL),
(9, 4, 'Plot / Land in Idukki', 'Plot / Land', 'For Sale', 65000.00, 522720, 'keee', 'Idukki', 0, 0, NULL, 'West', NULL, NULL, 'Broker', 'Active', 119, '2026-07-21 20:00:17', '2026-07-23 06:18:08', '123456789', '123456789', NULL, 'ramu', NULL, NULL, NULL),
(10, 7, 'Builder Floor in Kannur', 'Builder Floor', 'For Sale', 500000.00, 1500, 'jjjj', 'Kannur', 2, 2, 'Fully Furnished', 'North', '1-5 Years', 'hi', 'Owner', 'Active', 6, '2026-07-23 06:16:16', '2026-07-23 06:17:54', '7012021221', '7012021221', 'Arya', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=BNYVOnwOprU');

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
(3, 2, 'image', '/uploads/1784398869939-228014458.jpeg', 0),
(4, 2, 'image', '/uploads/1784398869943-845034954.png', 1),
(5, 3, 'image', '/uploads/1784399063422-937746533.jpeg', 0),
(6, 3, 'image', '/uploads/1784399063424-358159954.png', 1),
(7, 3, 'image', '/uploads/1784399063480-430873248.jpeg', 2),
(9, 5, 'image', '/uploads/1784654188485-455958141.JPG', 0),
(10, 5, 'video', '/uploads/1784654188489-410879281.mp4', 1),
(11, 6, 'image', '/uploads/1784654590310-626646178.jpeg', 0),
(12, 7, 'image', '/uploads/1784663054534-40736235.jpg', 0),
(13, 8, 'image', '/uploads/1784663198132-861393105.png', 0),
(14, 8, 'image', '/uploads/1784663198133-786674872.jpeg', 1),
(15, 9, 'image', '/uploads/1784664017518-135557093.jpg', 0),
(16, 9, 'image', '/uploads/1784664017521-338330973.png', 1),
(17, 9, 'video', '/uploads/1784664017521-886182975.webm', 2),
(18, 10, 'image', '/uploads/1784787376449-995976626.jpg', 0);

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
(4, 9, 4, 4, ' good experiece', '2026-07-21 20:32:59'),
(5, 9, 4, 3, 'good\n', '2026-07-21 20:39:44'),
(6, 9, 6, 1, 'happy', '2026-07-22 07:50:54');

-- --------------------------------------------------------

--
-- Table structure for table `property_views`
--

CREATE TABLE `property_views` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `visitor_id` int(11) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `property_views`
--

INSERT INTO `property_views` (`id`, `property_id`, `visitor_id`, `viewed_at`) VALUES
(3, 9, 6, '2026-07-22 07:49:34'),
(4, 9, 6, '2026-07-22 07:49:34'),
(5, 9, 6, '2026-07-22 07:49:55'),
(6, 9, 6, '2026-07-22 07:49:55'),
(7, 9, 6, '2026-07-22 07:49:57'),
(8, 9, 6, '2026-07-22 07:49:57'),
(9, 9, 6, '2026-07-22 07:50:28'),
(10, 9, 6, '2026-07-22 07:50:28'),
(11, 9, 6, '2026-07-22 07:50:54'),
(12, 9, 6, '2026-07-22 07:51:01'),
(13, 9, 6, '2026-07-22 07:51:01'),
(14, 9, 6, '2026-07-22 07:51:20'),
(15, 9, 6, '2026-07-22 07:51:20'),
(16, 8, 6, '2026-07-22 07:51:32'),
(17, 8, 6, '2026-07-22 07:51:32'),
(18, 7, 6, '2026-07-22 07:51:35'),
(19, 7, 6, '2026-07-22 07:51:35'),
(20, 6, 6, '2026-07-22 07:52:00'),
(21, 6, 6, '2026-07-22 07:52:00'),
(22, 3, 6, '2026-07-22 08:00:14'),
(23, 3, 6, '2026-07-22 08:00:14'),
(24, 9, 6, '2026-07-22 08:02:48'),
(25, 9, 6, '2026-07-22 08:02:48'),
(26, 9, 6, '2026-07-22 08:02:50'),
(27, 9, 6, '2026-07-22 08:02:50'),
(28, 9, 6, '2026-07-22 08:03:00'),
(29, 9, 6, '2026-07-22 08:03:00'),
(30, 9, 6, '2026-07-22 08:03:16'),
(31, 9, 6, '2026-07-22 08:03:16'),
(32, 9, 6, '2026-07-22 08:04:47'),
(33, 9, 6, '2026-07-22 08:04:47'),
(34, 9, 6, '2026-07-22 08:13:08'),
(35, 9, 6, '2026-07-22 08:13:08'),
(36, 9, 6, '2026-07-22 08:14:29'),
(37, 9, 6, '2026-07-22 08:14:30'),
(38, 9, 6, '2026-07-22 08:14:39'),
(39, 9, 6, '2026-07-22 08:14:39'),
(40, 9, 6, '2026-07-22 08:14:40'),
(41, 9, 6, '2026-07-22 08:14:40'),
(42, 9, 6, '2026-07-22 08:58:17'),
(43, 9, 6, '2026-07-22 08:58:17'),
(44, 9, 6, '2026-07-22 09:03:01'),
(45, 9, 6, '2026-07-22 09:03:01'),
(46, 9, 6, '2026-07-22 09:03:05'),
(47, 9, 6, '2026-07-22 09:03:05'),
(48, 9, 6, '2026-07-22 09:03:07'),
(49, 9, 6, '2026-07-22 09:03:07'),
(50, 9, 6, '2026-07-22 09:23:24'),
(51, 9, 6, '2026-07-22 09:23:24'),
(52, 9, 6, '2026-07-22 09:23:27'),
(53, 9, 6, '2026-07-22 09:23:27'),
(54, 9, 6, '2026-07-22 09:23:45'),
(55, 9, 6, '2026-07-22 09:23:45'),
(56, 9, 6, '2026-07-22 09:24:25'),
(57, 9, 6, '2026-07-22 09:24:25'),
(58, 9, 6, '2026-07-22 09:25:02'),
(59, 9, 6, '2026-07-22 09:25:20'),
(60, 9, 6, '2026-07-22 09:26:36'),
(61, 9, 6, '2026-07-22 09:26:36'),
(62, 9, 6, '2026-07-22 09:28:00'),
(63, 9, 6, '2026-07-22 09:28:35'),
(64, 9, 6, '2026-07-22 09:28:35'),
(65, 9, 6, '2026-07-22 09:40:35'),
(66, 9, 6, '2026-07-22 09:44:09'),
(67, 9, 6, '2026-07-22 09:44:09'),
(68, 9, 6, '2026-07-22 09:44:12'),
(69, 9, 6, '2026-07-22 09:44:12'),
(70, 3, 6, '2026-07-22 14:02:57'),
(71, 3, 6, '2026-07-22 14:02:58'),
(72, 9, 6, '2026-07-22 17:09:35'),
(73, 9, 6, '2026-07-22 17:09:36'),
(74, 9, 6, '2026-07-22 17:09:40'),
(75, 9, 6, '2026-07-22 17:09:40'),
(76, 9, 6, '2026-07-22 17:09:45'),
(77, 9, 6, '2026-07-22 17:09:45'),
(78, 3, 7, '2026-07-23 06:08:16'),
(79, 3, 7, '2026-07-23 06:08:16'),
(80, 10, 7, '2026-07-23 06:16:20'),
(81, 10, 7, '2026-07-23 06:16:20'),
(82, 10, 7, '2026-07-23 06:16:56'),
(83, 10, 7, '2026-07-23 06:16:56'),
(84, 10, 7, '2026-07-23 06:17:54'),
(85, 10, 7, '2026-07-23 06:17:54'),
(86, 9, 7, '2026-07-23 06:18:08'),
(87, 9, 7, '2026-07-23 06:18:08');

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

--
-- Dumping data for table `reported_listings`
--

INSERT INTO `reported_listings` (`id`, `property_id`, `reporter_id`, `reason`, `status`, `created_at`) VALUES
(3, 9, 4, 'Spam or Duplicate listing - spam', 'Resolved', '2026-07-21 20:19:08'),
(4, 9, 6, 'Spam or Duplicate listing - nothingg', 'Pending', '2026-07-22 08:02:58');

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
(2, 3, '2026-07-18 18:29:28'),
(4, 3, '2026-07-20 19:12:49'),
(4, 5, '2026-07-21 17:29:02'),
(4, 9, '2026-07-21 20:00:30'),
(6, 9, '2026-07-22 08:14:15');

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
('login_banner_url', '/uploads/1784713931417-589645004.jpeg'),
('welcome_banner_url', '/uploads/1784713395253-120595938.jpeg');

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
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `location`, `avatar_url`, `created_at`, `is_disabled`, `last_login`) VALUES
(1, 'Anjana RAJ', 'anjanaraj1243@gmail.com', NULL, '$2a$10$Sc9GM2h9rjnzWXbG8slqj.4au.j2PJLF2JV7TCBxlsbAEZzWS9eAS', NULL, NULL, '2026-07-15 19:03:13', 0, NULL),
(2, 'Anjana K R', 'greensparow@gmail.com', '7012021221', '$2a$10$.3WqlnKxncwnJl4JYSSe0eQgWT1.EumJ4ElMKu91PAwXYQQH1flRy', '', NULL, '2026-07-18 18:18:56', 0, NULL),
(3, 'thara', 'thara@gmail.com', NULL, '$2a$10$nbIZC0igb3akM.M4kQT3kewRh8MpbMG4psrwvHLOMzcrRlFwMYiJS', NULL, NULL, '2026-07-18 19:55:33', 0, NULL),
(4, '  sample ', 'sample@gmail.com', NULL, '$2a$10$bsdzvcg8TdNl5/0dFsPJNeG93h1GAPqFEj2FF1erOY8Sd8la5idtG', NULL, NULL, '2026-07-20 05:59:32', 0, NULL),
(5, 'ria', 'ria@gmail.com', NULL, '$2a$10$Ghbrw8uY7Eun17unAPzfQ.eAHdfXDp.a.091c87mpW1f/W5vaZhCe', NULL, NULL, '2026-07-22 07:29:46', 0, NULL),
(6, 'r', ' ria@gmail.com', NULL, '$2a$10$JhiRZbIP4w1py1JE.9yWbOn4NyDPGXzqlu9FHjEloEDZ8KnRZJ67.', NULL, NULL, '2026-07-22 07:48:25', 0, NULL),
(7, 'Arya', ' sample@gmail.com', NULL, '$2a$10$E8RtdiJtaTUJCZBKk3uk4u63tJPVZf/NPMfPtwm3hmqSdMwucwr5a', NULL, NULL, '2026-07-23 05:42:53', 0, '2026-07-23 05:42:53');

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
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `visitor_id` (`visitor_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `property_media`
--
ALTER TABLE `property_media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `property_reviews`
--
ALTER TABLE `property_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `property_views`
--
ALTER TABLE `property_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `reported_listings`
--
ALTER TABLE `reported_listings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD CONSTRAINT `enquiries_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enquiries_ibfk_2` FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD CONSTRAINT `saved_properties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_properties_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
