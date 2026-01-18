import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import rawData from './data/dubaiSouthProjects.json';

const priceFormatter = new Intl.NumberFormat('ar-AE');
const areaFormatter = new Intl.NumberFormat('ar-AE');
const dateFormatter = new Intl.DateTimeFormat('ar-AE', {
	month: 'long',
	year: 'numeric',
});

function formatPrice(value) {
	return `${priceFormatter.format(value)} درهم`;
}

function formatArea(value) {
	return `${areaFormatter.format(value)} قدم²`;
}

function formatMonth(value) {
	if (!value) return '—';
	const normalized = value.length === 7 ? `${value}-01` : value;
	const parsed = new Date(normalized);
	return dateFormatter.format(parsed);
}

function formatRoi(value) {
	if (value === null || value === undefined) return null;
	return `${value}% عائد سنوي متوقع`;
}

function computePricePerSqft(price, area, fallback) {
	if (fallback !== null && fallback !== undefined) return fallback;
	if (!price || !area) return null;
	return Math.round((price / area) * 100) / 100;
}

function computeRoiFromRent(price, monthlyRent, fallback) {
	if (fallback !== null && fallback !== undefined) return fallback;
	if (!price || !monthlyRent) return null;
	const annualRent = monthlyRent * 12;
	const roi = (annualRent / price) * 100;
	return Math.round(roi * 100) / 100;
}

function PaymentPlanDisplay({ plan, dense = false }) {
	if (!plan) return null;
	const hasPercentages = Array.isArray(plan.percentages) && plan.percentages.length > 0;
	const badgeClass =
		'rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white shadow-inner shadow-black/20';
	return (
		<div className={`flex flex-wrap gap-2 ${dense ? 'text-xs' : 'text-sm'}`}>
			{hasPercentages
				? plan.percentages.map((step, idx) => (
					<span key={`${step.label || 'step'}-${idx}`} className={badgeClass}>
						{step.value}% {step.label || ''}
					</span>
				))
				: null}
			{typeof plan.installments === 'number' ? (
				<span className={badgeClass}>عدد الدفعات: {plan.installments}</span>
			) : null}
			{typeof plan.total_price === 'number' ? (
				<span className={badgeClass}>إجمالي: {formatPrice(plan.total_price)}</span>
			) : null}
			{plan.notes ? (
				<span className={`${badgeClass} bg-amber-300/15 border-amber-200/30 text-amber-100`}>{plan.notes}</span>
			) : null}
		</div>
	);
}

function LocationLink({ project, inline = false }) {
	const label = project.location_details || project.stadium || 'الموقع غير متوفر';
	if (project.map_url) {
		return (
			<a
				href={project.map_url}
				target="_blank"
				rel="noreferrer"
				className={`inline-flex items-center gap-2 text-amber-200 underline-offset-4 hover:text-amber-100 ${inline ? '' : 'text-sm'
					}`}
			>
				<span>{label}</span>
				<span className="text-xs rounded-3xl bg-red-500/10 px-2 whitespace-nowrap py-1 text-red-500 justify-center items-center flex ">افتح الخريطة ↗</span>
			</a>
		);
	}
	return <span className={inline ? '' : 'text-sm'}>{label}</span>;
}

function statusBadge(status) {
	const normalized = (status || '').toLowerCase();
	const map = {
		'off plan': { label: 'Off Plan', color: 'bg-amber-300/20 text-amber-100 border-amber-300/40' },
		'ready': { label: 'Ready', color: 'bg-emerald-300/20 text-emerald-100 border-emerald-300/40' },
		'sold out': { label: 'Sold Out', color: 'bg-rose-300/20 text-rose-100 border-rose-300/40' },
	};
	const entry = map[normalized] || { label: status || 'Status', color: 'bg-white/10 text-white border-white/20' };
	return (
		<span
			className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-inner shadow-black/30 ${entry.color}`}
		>
			{entry.label}
		</span>
	);
}

function inferZone(project) {
	const text = `${project.location_details || ''} ${project.stadium || ''} ${project.title || ''}`.toLowerCase();
	if (text.includes('dubai south') || text.includes('دبي الجنوب') || text.includes('دوبي ثوس')) return 'Dubai South';
	if (
		text.includes('dubailand') ||
		text.includes('dlrc') ||
		text.includes('مجان') ||
		text.includes('أرجان') ||
		text.includes('دبي لاند')
	)
		return 'Dubailand';
	return null;
}

function zoneBadge(zone) {
	if (!zone) return null;
	const color =
		zone === 'Dubai South'
			? 'bg-cyan-300/20 text-cyan-100 border-cyan-300/40'
			: 'bg-amber-300/20 text-amber-100 border-amber-300/40';
	return (
		<span className={`rounded-full border px-3 py-1 text-[11px] font-semibold shadow-inner shadow-black/30 ${color}`}>
			{zone}
		</span>
	);
}

function zoneSubtitle(zone) {
	if (zone === 'Dubailand') return 'مشروع دوبي ثوس';
	if (zone === 'Dubai South') return 'مشروع دبي الجنوب';
	return 'مشروع';
}

function safeSlugFromName(name) {
	const lower = (name || 'developer').toLowerCase();
	return `auto-${lower.split(' ').join('-')}`;
}

const projects = rawData.filter((item) => Array.isArray(item.units));

const developersData = rawData.flatMap((item) => item.developers || []);
const zoneDeveloperNames = Array.from(
	new Set(
		projects
			.filter((project) => {
				const zone = inferZone(project);
				return zone === 'Dubailand' || zone === 'Dubai South';
			})
			.map((project) => project.developer)
			.filter(Boolean),
	),
);
const developers = zoneDeveloperNames.map((name) => {
	const target = (name || '').toLowerCase();
	const match = developersData.find((dev) => {
		const nameAr = (dev.name || '').toLowerCase();
		const nameEn = (dev.name_en || '').toLowerCase();
		return nameAr === target || nameEn === target;
	});
	if (match) return match;
	return { slug: safeSlugFromName(name), name, name_en: null };
});
const realEstateTerms = rawData.flatMap((item) => item.real_estate_terms || []);
const uaeInfo = rawData.find((item) => item.uae_info)?.uae_info || {};

function metricFromProjects() {
	const safeProjects = projects.filter((p) => Array.isArray(p.units));
	const totalArea = safeProjects.reduce((sum, project) => sum + (project.total_area || 0), 0);
	const totalUnits = safeProjects.reduce((sum, project) => {
		const units = Array.isArray(project.units) ? project.units : [];
		return sum + units.reduce((unitSum, unit) => unitSum + (unit.count || 0), 0);
	}, 0);
	const averagePrice =
		safeProjects.length > 0
			? Math.round(
				safeProjects.reduce((sum, project) => sum + (project.price_dirham || 0), 0) /
				safeProjects.length,
			)
			: 0;

	return { totalArea, totalUnits, averagePrice };
}

function MetricCard({ label, value, hint }) {
	return (
		<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
			<p className="text-sm text-white/70">{label}</p>
			<p className="mt-1 text-2xl font-semibold text-white">{value}</p>
			{hint ? <p className="text-xs text-white/60">{hint}</p> : null}
		</div>
	);
}

function UnitCard({ unit }) {
	const pricePerSqft = computePricePerSqft(unit.price_dirham, unit.area, unit.price_per_sqft);
	const roiValue = computeRoiFromRent(unit.price_dirham, unit.monthly_rent_dirham, unit.roi_estimated_annual_pct);
	return (
		<div className="flex items-start justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 shadow-inner shadow-black/30">
			<div className="space-y-1">
				<p className="text-base font-semibold text-white">{unit.type}</p>
				<p className="text-xs text-white/70">
					{unit.area ? formatArea(unit.area) : '—'}
					{pricePerSqft ? ` • ${pricePerSqft} درهم/قدم²` : ''}
				</p>
				{unit.location ? <p className="text-xs text-white/70">الموقع: {unit.location}</p> : null}
				{roiValue ? (
					<p className="text-xs text-emerald-200">
						{formatRoi(roiValue)}
					</p>
				) : null}
			</div>
			<div className="text-right space-y-1">
				<p className="text-sm text-white/70">عدد: {unit.count}</p>
				<p className="text-lg font-semibold text-amber-200">{formatPrice(unit.price_dirham)}</p>
			</div>
		</div>
	);
}

function ProjectCard({ project, index }) {
	const projectName = project.name || project.title;
	const projectMonthlyRent = project.monthly_rent_dirham || project.units?.[0]?.monthly_rent_dirham;
	const projectRoiValue = computeRoiFromRent(
		project.price_dirham,
		projectMonthlyRent,
		project.roi_estimated_annual_pct,
	);
	const roiText = formatRoi(projectRoiValue);
	const zone = inferZone(project);
	const zoneLabel = zoneSubtitle(zone);
	return (
		<article className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 p-6 shadow-2xl shadow-black/40 backdrop-blur min-h-full  transition-all duration-300 cursor-pointer">
			<div className="pointer-events-none absolute inset-0 opacity-40">
				<div className="absolute -left-10 top-0 h-64 w-64 rounded-full bg-amber-400/30 blur-3xl" />
				<div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" />
			</div>

			<header className="relative mb-4 flex flex-col xl:flex-row gap-2  items-start xl:items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">
						{index + 1}
					</span>
					<div>
						<p className="text-sm text-white/70">{zoneLabel}</p>
						<h3 className="text-lg font-semibold whitespace-nowrap leading-tight text-white">{projectName}</h3>
						{project.name_en ? (
							<p className="text-[13px]  whitespace-nowrap  text-white/70 underline ">{project.name_en}</p>
						) : null}
						{project.title && project.title !== projectName ? (
							<p className="text-xs   text-white/70">{project.title}</p>
						) : null}
					</div>
				</div>
				<div className="flex items-center gap-2 xl:whitespace-nowrap  xl:flex-col">
					{statusBadge(project.status)}
					{zoneBadge(zone)}
					<div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-inner shadow-black/30">
						{formatMonth(project.date)}
					</div>
					{roiText ? (
						<div className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 border border-emerald-300/40 shadow-inner shadow-black/30">
							{roiText}
						</div>
					) : null}
				</div>
			</header>

			<dl className="relative grid grid-cols-2 gap-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/40">
				<div className='col-span-2 '>
					<dt className="text-white/60 mb-2">الموقع</dt>
					<dd className="font-semibold text-white">
						<LocationLink project={project} inline />
					</dd>
				</div>
				<div>
					<dt className="text-white/60">السعر</dt>
					<dd className="font-semibold text-amber-200">{formatPrice(project.price_dirham)}</dd>
				</div>
				{project.payment_plan ? (
					<div className="col-span-2">
						<dt className="text-white/60">خطة الدفع</dt>
						<dd className="font-semibold text-white">
							<PaymentPlanDisplay plan={project.payment_plan} dense />
						</dd>
					</div>
				) : null}
				<div>
					<dt className="text-white/60">المساحة الأساسية</dt>
					<dd className="font-semibold">{formatArea(project.area)}</dd>
				</div>
				<div>
					<dt className="text-white/60">المساحة الكلية</dt>
					<dd className="font-semibold">{formatArea(project.total_area)}</dd>
				</div>

			</dl>

			<section className="relative mt-4 space-y-3 ">
				<p className="text-sm font-semibold text-white">الوحدات المتاحة</p>
				<div className="grid gap-3 sm:grid-cols-1">
					{(project.units || []).map((unit) => (
						<UnitCard key={`${project.title}-${unit.type}-${unit.area}`} unit={unit} />
					))}
				</div>
			</section>
		</article>
	);
}

function ProjectGrid() {
	const navigate = useNavigate();

	return (
		<section className="grid gap-6 md:grid-cols-2 ">
			{projects.map((project, index) => (
				<button
					type="button"
					className="text-left"
					onClick={() => navigate(`/projects/${project.slug || index}`)}
					key={project.slug || project.name || project.title || `project-${index}`}
				>
					<ProjectCard project={project} index={index} />
				</button>
			))}
		</section>
	);
}

function ProjectDetails() {
	const { slug } = useParams();
	const project =
		projects.find((item) => item.slug === slug) || projects[Number(slug)] || projects[0];
	const projectMonthlyRent = project.monthly_rent_dirham || project.units?.[0]?.monthly_rent_dirham;
	const projectRoiValue = computeRoiFromRent(
		project.price_dirham,
		projectMonthlyRent,
		project.roi_estimated_annual_pct,
	);
	const zone = inferZone(project);
	const zoneLabel = zoneSubtitle(zone);

	if (!project) {
		return (
			<div className="text-white">
				<p>المشروع غير موجود.</p>
				<Link className="text-amber-200 underline" to="/">
					العودة للصفحة الرئيسية
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
			<Link
				to="/"
				className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/30 hover:bg-white/20"
			>
				<span className="text-lg">←</span>
				<span>رجوع لكل المشاريع</span>
			</Link>

			<article className="overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 shadow-2xl shadow-black/40 backdrop-blur">
				<div className="relative h-72 w-full bg-black/40">
					{project.image_url ? (
						<img

							src={project.image_url}
							alt={project.name || project.title}
							className="h-full w-full object-cover"
							loading="lazy"
							decoding='async'
						/>
					) : null}
					<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
					<div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="text-sm text-white/70">{zoneLabel}</p>
							<h1 className="text-2xl font-bold text-white">{project.name || project.title}</h1>
							{project.name_en ? <p className="text-sm text-white/70">{project.name_en}</p> : null}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							{statusBadge(project.status)}
							{zoneBadge(zone)}
							<div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-inner shadow-black/30">
								{formatMonth(project.date)}
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-6 p-6 md:grid-cols-3">
					<div className="md:col-span-2 space-y-4">
						<p className="text-sm text-white/80">{project.title}</p>
						{project.description ? (
							<p className="text-sm leading-relaxed text-white/70">{project.description}</p>
						) : null}

						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">المطور</p>
								<p className="text-base font-semibold text-white">{project.developer || 'غير محدد'}</p>
								{project.other_projects_by_developer && project.other_projects_by_developer.length > 0 ? (
									<div className="mt-2 space-y-1">
										<p className="text-xs text-white/60">مشاريع أخرى لنفس المطور:</p>
										<div className="flex flex-wrap gap-2">
											{project.other_projects_by_developer.map((name) => (
												<span
													key={name}
													className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white shadow-inner shadow-black/20"
												>
													{name}
												</span>
											))}
										</div>
									</div>
								) : null}
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">الموقع</p>
								<p className="text-base font-semibold text-white">
									<LocationLink project={project} />
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">السعر الابتدائي</p>
								<p className="text-base font-semibold text-amber-200">
									{formatPrice(project.price_dirham)}
								</p>
							</div>
							{project.payment_plan ? (
								<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
									<p className="text-white/60 text-sm">خطة الدفع</p>
									<div className="text-base font-semibold text-white">
										<PaymentPlanDisplay plan={project.payment_plan} />
									</div>
								</div>
							) : null}
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">المساحة الكلية</p>
								<p className="text-base font-semibold">{formatArea(project.total_area)}</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">تاريخ الإطلاق</p>
								<p className="text-base font-semibold">
									{project.launch_date ? formatMonth(project.launch_date) : '—'}
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">تاريخ التسليم</p>
								<p className="text-base font-semibold">
									{project.handover_date ? formatMonth(project.handover_date) : '—'}
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">العائد السنوي المتوقع</p>
								<p className="text-base font-semibold">
									{projectRoiValue ? formatRoi(projectRoiValue) : '—'}
								</p>
								{project.roi_notes ? (
									<p className="text-xs text-white/60 mt-1">{project.roi_notes}</p>
								) : null}
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-white/60 text-sm">رسوم الخدمات</p>
								<p className="text-base font-semibold">
									{project.service_charge_aed_per_sqft
										? `${project.service_charge_aed_per_sqft} درهم / قدم²`
										: 'غير محدد'}
								</p>
								{project.service_charge_notes ? (
									<p className="text-xs text-white/60 mt-1">{project.service_charge_notes}</p>
								) : null}
							</div>
						</div>

						{project.services_included && project.services_included.length > 0 ? (
							<div className="space-y-2">
								<p className="text-sm font-semibold text-white">الخدمات والمرافق</p>
								<div className="flex flex-wrap gap-2">
									{project.services_included.map((service) => (
										<span
											key={service}
											className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white shadow-inner shadow-black/20"
										>
											{service}
										</span>
									))}
								</div>
							</div>
						) : null}
						{project.developer_story ? (
							<div className="rounded-2xl border border-amber-200/20 bg-linear-to-br from-amber-300/10 via-white/5 to-white/5 px-4 py-3 text-white/80 shadow-inner shadow-black/30">
								<p className="text-sm font-semibold text-amber-100 mb-1">قصة المطور</p>
								<p className="text-sm leading-relaxed text-white/80">{project.developer_story}</p>
							</div>
						) : null}
					</div>

					<div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
						<p className="text-sm font-semibold text-white">الوحدات المتاحة</p>
						<div className="space-y-3 mb-20 md:mb-0">
							{project.units.map((unit) => (
								<UnitCard key={`${project.slug}-${unit.type}-${unit.area}`} unit={unit} />
							))}
						</div>
					</div>
				</div>
			</article>
		</div>
	);
}

function HomeLayout() {
	const { totalArea, averagePrice } = metricFromProjects();

	return (
		<div className="min-h-screen  bg-slate-950 text-white">
			<div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(248,180,0,0.16),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.14),transparent_25%)]" />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
				<header className="rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="space-y-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/60">Dubai South</p>
							<h1 className="text-3xl font-bold leading-tight text-white md:text-4xl animate-pulse transition-all duration-100 ">
								Dubai South Projects
							</h1>
							<div className="flex flex-col justify-start items-start gap-3 px-4 py-2 text-sm text-white/80 ">

								{/*  */}
								<div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/30">
									<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
									<span className='animate-pulse transition-all duration-100 '>Kareem-Shalan

									</span>

								</div>
								{/*  */}
								<div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/30">
									<span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
									<a target='_blank' href={"https://my-portfolio-iota-seven-84.vercel.app/"} className='animate-pulse transition-all duration-100 '> https://my-portfolio-iota-seven-84.vercel.app/

									</a>

								</div>

							</div>

							<ul className="grid gap-2 sm:grid-cols-3">
								<li>
									<a
										href="https://dxbinteract.com/"
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-black/30 transition hover:-translate-y-[2px] hover:border-amber-200/40 hover:bg-white/10"
									>
										<span className="font-semibold">DXB Interact</span>
										<span className="text-xs text-amber-200">↗</span>
									</a>
								</li>
								<li>
									<a
										href="https://dxboffplan.com/"
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-black/30 transition hover:-translate-y-[2px] hover:border-amber-200/40 hover:bg-white/10"
									>
										<span className="font-semibold">DXB Offplan </span>
										<span className="text-xs text-amber-200">↗</span>
									</a>
								</li>
								<li>
									<a
										href="https://www.propertyfinder.ae/"
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white shadow-inner shadow-black/30 transition hover:-translate-y-[2px] hover:border-amber-200/40 hover:bg-white/10"
									>
										<span className="font-semibold">Property Finder</span>
										<span className="text-xs text-amber-200">↗</span>
									</a>
								</li>
							</ul>

						</div>


					</div>
					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						<MetricCard label="متوسط السعر الابتدائي" value={formatPrice(averagePrice)} />
						<MetricCard label="إجمالي المساحات" value={formatArea(totalArea)} hint="مجموع المساحات الكلية للمشاريع" />
					</div>
				</header>
				<header className="rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
					<img loading='eager' decoding='async' className='rounded-2xl' src="/Dubai-3D-map-with-Azizi-developments.png" alt="" />

				</header>

				<ProjectGrid />

				{developers.length > 0 ? (
					<section className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
						<header className="flex flex-col gap-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/60">Developers</p>
							<h2 className="text-2xl font-bold text-white">أبرز المطورين</h2>
							<p className="text-sm text-white/70">ملخص سريع لأبرز ما يميز كل مطور ومشاريعه.</p>
						</header>
						<div className="grid gap-4 md:grid-cols-2">
							{developers.map((dev) => (
								<div
									key={dev.slug}
									className="rounded-2xl border  border-white/10 bg-black/30 px-4 py-4 shadow-inner shadow-black/30"
								>
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-white/60">المطور</p>
											<p className="text-lg font-semibold text-white">{dev.name}</p>
											{dev.name_en ? <p className="text-xs text-white/70">{dev.name_en}</p> : null}
											{dev.founded_year ? (
												<p className="text-[11px] text-white/60 mt-1">سنة التأسيس: {dev.founded_year}</p>
											) : null}
										</div>
										{dev.contact_info?.website ? (
											<a
												href={dev.contact_info.website}
												target="_blank"
												rel="noreferrer"
												className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs text-amber-100"
											>
												الموقع ↗
											</a>
										) : null}
									</div>
									<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
										{dev.chairman ? (
											<div>
												<p className="text-white/50">Chairman</p>
												<p className="text-white">{dev.chairman}</p>
											</div>
										) : null}
										{dev.ceo ? (
											<div>
												<p className="text-white/50">CEO</p>
												<p className="text-white">{dev.ceo}</p>
											</div>
										) : null}
									</div>
									{dev.story ? (
										<div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75 shadow-inner shadow-black/20">
											{dev.story}
										</div>
									) : null}
									{dev.key_strengths?.length ? (
										<div className="mt-3">
											<p className="text-xs text-white/60 mb-1">ما يميز المطور</p>
											<div className="flex flex-wrap gap-2">
												{dev.key_strengths.map((s) => (
													<span
														key={s}
														className="rounded-full border border-emerald-200/30 bg-emerald-200/10 px-3 py-1 text-[11px] text-emerald-50 shadow-inner shadow-black/20"
													>
														{s}
													</span>
												))}
											</div>
										</div>
									) : null}
									{dev.projects_locations?.length ? (
										<div className="mt-3">
											<p className="text-xs text-white/60 mb-1">مشاريع ومواقعها</p>
											<div className="flex flex-col gap-1 text-[11px] text-white/75">
												{dev.projects_locations.map((p) => (
													<div key={`${dev.slug}-${p.name}`} className="flex flex-wrap gap-1">
														<span className="rounded border border-white/10 bg-white/10 px-2 py-[2px]">{p.name}</span>
														<span className="text-white/50">— {p.location}</span>
													</div>
												))}
											</div>
										</div>
									) : dev.projects?.length ? (
										<div className="mt-3">
											<p className="text-xs text-white/60 mb-1">مشاريع مميزة</p>
											<div className="flex flex-wrap gap-2">
												{dev.projects.map((proj) => (
													<span
														key={proj}
														className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white shadow-inner shadow-black/20"
													>
														{proj}
													</span>
												))}
											</div>
										</div>
									) : null}
									<div className="mt-3 text-xs text-emerald-200">
										{dev.key_strengths?.[0]
											? `يتميز ${dev.name_en || dev.name} بـ${dev.key_strengths[0]}`
											: `مطور نشط في دبي.`}
									</div>
								</div>
							))}
						</div>
					</section>
				) : null}

				{realEstateTerms.length > 0 ? (
					<section className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
						<header className="flex flex-col gap-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/60">Knowledge</p>
							<h2 className="text-2xl font-bold text-white">مصطلحات عقارية</h2>
							<p className="text-sm text-white/70">تعريفات مختصرة لرسوم وخطوات التملك والتسجيل.</p>
						</header>
						<div className="grid gap-3 md:grid-cols-2">
							{realEstateTerms.map((term) => (
								<div
									key={`term-${term.id || term.term}`}
									className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/30"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-white">{term.term}</p>
											{term.abbreviation ? (
												<p className="text-xs ring-1 w-fit p-1 mt-3 rounded-2xl bg-amber-300/20 text-amber-200">{term.abbreviation}</p>
											) : null}
										</div>
										{term.id ? (
											<span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/70">
												#{term.id}
											</span>
										) : null}
									</div>
									{term.description ? (
										<p className="mt-2 whitespace-pre-line text-xs text-white/70">{term.description}</p>
									) : null}
								</div>
							))}
						</div>
					</section>
				) : null}

				{(uaeInfo.emirates?.length || uaeInfo.dubai_roads?.length) ? (
					<section className="space-y-4 rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
						<header className="flex flex-col gap-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/60">UAE</p>
							<h2 className="text-2xl font-bold text-white">الطرق والإمارات السبع</h2>
							<p className="text-sm text-white/70">
								أهم شوارع دبي والطرق الاتحادية، مع حكام الإمارات السبع.
							</p>
						</header>
						<div className="grid gap-4 md:grid-cols-2">
							{uaeInfo.dubai_roads?.length ? (
								<div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/30">
									<p className="text-sm font-semibold text-white">أهم شوارع دبي</p>
									<ul className="list-disc space-y-1 pl-5 text-xs text-white/80">
										{uaeInfo.dubai_roads.map((road) => (
											<li key={road}>{road}</li>
										))}
									</ul>
								</div>
							) : null}

							{uaeInfo.emirates?.length ? (
								<div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/30">
									<p className="text-sm font-semibold text-white">الإمارات السبع وحكامها</p>
									<div className="space-y-2 text-xs text-white/80">
										{uaeInfo.emirates.map((em) => (
											<div
												key={em.name}
												className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-inner shadow-black/20"
											>
												<p className="text-white font-semibold text-sm">{em.name}</p>
												<p className="text-white/80">الحاكم: {em.ruler}</p>
												{em.capital ? <p className="text-white/60">العاصمة: {em.capital}</p> : null}
											</div>
										))}
									</div>
								</div>
							) : null}

							{uaeInfo.uae_key_highways?.length ? (
								<div className="space-y-2  rounded-2xl border border-white/10 bg-black/30 px-4 py-4 mb-20 md:mb-0 shadow-inner shadow-black/30 md:col-span-2">
									<p className="text-sm font-semibold text-white">طرق اتحادية رئيسية</p>
									<div className="flex flex-wrap gap-2 text-xs text-white/80">
										{uaeInfo.uae_key_highways.map((hwy) => (
											<span
												key={hwy}
												className="rounded-full border border-white/10 bg-white/10 px-3 py-1 shadow-inner shadow-black/20"
											>
												{hwy}
											</span>
										))}
									</div>
								</div>
							) : null}
						</div>
					</section>
				) : null}
			</main>
		</div>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomeLayout />} />
				<Route path="/projects/:slug" element={<ProjectDetails />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
