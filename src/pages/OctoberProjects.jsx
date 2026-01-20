import { Link } from 'react-router-dom';
import octoberData from '../data/octoberProjects.json';

const egpFormatter = new Intl.NumberFormat('ar-EG');
const areaFormatter = new Intl.NumberFormat('ar-EG');

const bedroomLabels = {
	'1br': 'غرفة واحدة',
	'2br': 'غرفتين',
	'3br': '3 غرف',
	'4br': '4 غرف',
};

function formatEgp(value) {
	if (value === null || value === undefined || value === '') return '—';
	return `${egpFormatter.format(value)} جنيه`;
}

function formatAreaRange(minValue, maxValue, notes) {
	if (!minValue && !maxValue) return notes || '—';
	if (minValue && maxValue) return `${areaFormatter.format(minValue)} - ${areaFormatter.format(maxValue)} م²`;
	const value = minValue || maxValue;
	return `${areaFormatter.format(value)} م²`;
}

function formatPercent(value) {
	if (value === null || value === undefined || value === '') return '—';
	return `${value}%`;
}

function statusBadge(status) {
	const normalized = (status || '').toLowerCase();
	const map = {
		'off plan': { label: 'Off Plan', color: 'bg-amber-300/20 text-amber-100 border-amber-300/40' },
		'under construction': { label: 'تحت الإنشاء', color: 'bg-sky-300/20 text-sky-100 border-sky-300/40' },
		'ready': { label: 'جاهز للاستلام', color: 'bg-emerald-300/20 text-emerald-100 border-emerald-300/40' },
	};
	const entry = map[normalized] || { label: status || 'غير محدد', color: 'bg-white/10 text-white border-white/20' };
	return (
		<span className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-inner shadow-black/30 ${entry.color}`}>
			{entry.label}
		</span>
	);
}

function OctoberProjectCard({ project, index }) {
	const locationLabel = [project.location?.district, project.location?.description]
		.filter(Boolean)
		.join(' - ');
	const landmarks = project.location?.nearby_landmarks || [];
	const unitTypes = project.unit_types || [];
	const features = project.features || [];
	const unitPriceBreakdown = Array.isArray(project.unit_price_breakdown) ? project.unit_price_breakdown : [];
	const formatUnitType = (value) => {
		const key = (value || '').toLowerCase();
		return bedroomLabels[key] || value || '';
	};
	return (
		<article className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 p-6 shadow-2xl shadow-black/40 backdrop-blur ">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">
						{index + 1}
					</span>
					<div>
						<p className="text-xs text-white/60">المطور: {project.developer || 'غير محدد'}</p>
						<h3 className="text-xl font-semibold text-white">{project.name || 'مشروع بدون اسم'}</h3>
						<p className="text-sm text-white/70">{project.project_type || 'مشروع سكني'}</p>
					</div>
				</div>
				{statusBadge(project.status)}
			</header>

			<dl className="mt-4 grid gap-4 rounded-2xl border border-white/5 bg-black/20 px-4 py-4 text-sm text-white/80 shadow-inner shadow-black/40 md:grid-cols-2">
				<div className="md:col-span-2">
					<dt className="text-white/60">الموقع</dt>
					<dd className="font-semibold text-white">
						{project.location?.map_url ? (
							<a
								href={project.location.map_url}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 text-amber-200 underline-offset-4 hover:text-amber-100"
							>
								<span>{locationLabel || 'غير محدد'}</span>
								<span className="text-xs rounded-3xl bg-red-500/10 px-2 py-1 text-red-200">افتح الخريطة ↗</span>
							</a>
						) : (
							<span>{locationLabel || 'غير محدد'}</span>
						)}
					</dd>
					{landmarks.length > 0 ? (
						<p className="mt-2 text-xs text-white/60">المعالم القريبة: {landmarks.join('، ')}</p>
					) : null}
				</div>

				<div>
					<dt className="text-white/60">نوع الوحدات</dt>
					<dd className="font-semibold text-white">{unitTypes.length ? unitTypes.join(' • ') : 'غير محدد'}</dd>
				</div>
				<div>
					<dt className="text-white/60">المساحات المتاحة</dt>
					<dd className="font-semibold text-white">
						{formatAreaRange(project.areas_sqm?.min, project.areas_sqm?.max, project.areas_sqm?.notes)}
					</dd>
				</div>
				<div>
					<dt className="text-white/60">السعر الإجمالي</dt>
					<dd className="font-semibold text-amber-200">{formatEgp(project.prices_egp?.unit_total_from)}</dd>
					{project.prices_egp?.notes ? (
						<p className="mt-1 text-xs text-white/60">{project.prices_egp.notes}</p>
					) : null}
				</div>
				<div>
					<dt className="text-white/60">سعر المتر</dt>
					<dd className="font-semibold">{formatEgp(project.prices_egp?.price_per_sqm_from)}</dd>
				</div>
				<div>
					<dt className="text-white/60">مقدم الحجز</dt>
					<dd className="font-semibold">{formatPercent(project.payment_plan?.down_payment_pct)}</dd>
				</div>
				<div>
					<dt className="text-white/60">مدة التقسيط</dt>
					<dd className="font-semibold">
						{project.payment_plan?.installment_years ? `${project.payment_plan.installment_years} سنوات` : '—'}
					</dd>
					{project.payment_plan?.notes ? (
						<p className="mt-1 text-xs text-white/60">{project.payment_plan.notes}</p>
					) : null}
				</div>
				<div>
					<dt className="text-white/60">موعد الاستلام</dt>
					<dd className="font-semibold">{project.handover?.date || project.handover?.status || '—'}</dd>
				</div>
			</dl>

			{unitPriceBreakdown.length ? (
				<div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/30">
					<p className="text-sm font-semibold text-white">أسعار الوحدات المتاحة</p>
					<div className="mt-2 grid gap-2 sm:grid-cols-2">
						{unitPriceBreakdown.map((item, idx) => {
							const labelParts = [
								formatUnitType(item.unit_type),
								item.variant,
								item.area_sqm ? `${areaFormatter.format(item.area_sqm)} م²` : '',
							]
								.filter(Boolean)
								.join(' • ');
							return (
								<div
									key={`${project.name}-unit-${idx}`}
									className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70"
								>
									<p className="font-semibold text-white">{labelParts || 'وحدة'}</p>
									<p className="text-amber-200">{formatEgp(item.price_egp)}</p>
									{item.notes ? <p className="mt-1 text-[11px] text-white/60">{item.notes}</p> : null}
								</div>
							);
						})}
					</div>
				</div>
			) : null}

			{features.length ? (
				<div className="mt-4">
					<p className="text-sm font-semibold text-white">مميزات المشروع</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{features.map((feature) => (
							<span
								key={`${project.name}-${feature}`}
								className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-white shadow-inner shadow-black/20"
							>
								{feature}
							</span>
						))}
					</div>
				</div>
			) : null}
		</article>
	);
}

export default function OctoberProjectsPage() {
	const meta = octoberData?.meta || {};
	const projects = Array.isArray(octoberData?.projects) ? octoberData.projects : [];
	const makeSlug = (value) =>
		(value || '')
			.toLowerCase()
			.replace(/[^\w\u0600-\u06FF]+/g, '-')
			.replace(/-+/g, '-')
			.replace(/(^-|-$)/g, '');

	return (
		<div className="min-h-screen bg-slate-950 text-white">
			<div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(248,180,0,0.16),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.14),transparent_25%)]" />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
				<nav className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/30 backdrop-blur">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<span className="text-xs uppercase tracking-[0.2em] text-white/60">Navigation</span>
							<span className="text-white/50">|</span>
							<Link className="text-white hover:text-amber-200" to="/">
								Dubai South
							</Link>
							<Link className="text-white hover:text-amber-200" to="/october">
								6 October
							</Link>
						</div>
						<div className="text-xs text-white/50">Real Estate Dashboard</div>
					</div>
				</nav>
				<header className="rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-7 shadow-2xl shadow-black/40 backdrop-blur">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="space-y-2">
							<p className="text-sm uppercase tracking-[0.2em] text-white/60">6 October</p>
							<h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">مشاريع مدينة 6 أكتوبر</h1>
							<p className="text-sm text-white/70">
								قاعدة بيانات منفصلة يمكن تعديلها من ملف JSON بسهولة.
							</p>
						</div>
						<Link
							to="/"
							className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 shadow-inner shadow-black/30 hover:bg-white/20"
						>
							<span className="text-lg">←</span>
							<span>العودة لصفحة دبي الجنوب</span>
						</Link>
					</div>
					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
							<p className="text-sm text-white/70">عدد المشاريع</p>
							<p className="mt-1 text-2xl font-semibold text-white">{projects.length}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
							<p className="text-sm text-white/70">آخر تحديث</p>
							<p className="mt-1 text-2xl font-semibold text-white">{meta.last_updated || '—'}</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur">
							<p className="text-sm text-white/70">العملة</p>
							<p className="mt-1 text-2xl font-semibold text-white">{meta.currency || 'EGP'}</p>
						</div>
					</div>
				</header>

				{projects.length ? (
					<section className="grid gap-6 md:grid-cols-2">
						{projects.map((project, index) => (
							<Link
								key={`${project.name}-${index}`}
								to={`/october/${project.slug || makeSlug(project.name) || index}`}
								className="text-left"
							>
								<OctoberProjectCard project={project} index={index} />
							</Link>
						))}
					</section>
				) : (
					<section className="rounded-3xl border border-white/10 bg-linear-to-br from-white/10 via-white/5 to-white/10 px-6 py-10 text-center shadow-2xl shadow-black/40 backdrop-blur">
						<h2 className="text-xl font-semibold text-white">لا توجد مشاريع بعد</h2>
						<p className="mt-2 text-sm text-white/70">
							أضف البيانات داخل ملف <span className="text-amber-200">src/data/octoberProjects.json</span> ثم حدّث الصفحة.
						</p>
					</section>
				)}
			</main>
		</div>
	);
}
